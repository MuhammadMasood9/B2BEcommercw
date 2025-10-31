import { db } from "./db";
import { 
  platformSettings, 
  platformSettingsHistory, 
  platformSettingsValidation, 
  platformSettingsDeployments,
  platformSettingsImpact,
  type PlatformSetting,
  type PlatformSettingsHistory,
  type PlatformSettingsValidation,
  type InsertPlatformSetting,
  type InsertPlatformSettingsHistory
} from "@shared/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

export interface SettingValue {
  string?: string;
  number?: number;
  boolean?: boolean;
  json?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImpactAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
  affectedUsers: string[];
  estimatedDowntime?: number;
  rollbackComplexity: 'simple' | 'moderate' | 'complex';
  recommendations: string[];
}

export interface SettingsChangeRequest {
  settingId: string;
  newValue: SettingValue;
  changeReason: string;
  requestedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

export class PlatformSettingsService {
  
  // ==================== SETTINGS RETRIEVAL ====================
  
  async getAllSettings(environment: string = 'production'): Promise<PlatformSetting[]> {
    return await db.select()
      .from(platformSettings)
      .where(and(
        eq(platformSettings.environment, environment),
        eq(platformSettings.isActive, true)
      ))
      .orderBy(platformSettings.category, platformSettings.key);
  }

  async getSettingsByCategory(category: string, environment: string = 'production'): Promise<PlatformSetting[]> {
    return await db.select()
      .from(platformSettings)
      .where(and(
        eq(platformSettings.category, category),
        eq(platformSettings.environment, environment),
        eq(platformSettings.isActive, true)
      ))
      .orderBy(platformSettings.key);
  }

  async getSetting(category: string, key: string, environment: string = 'production'): Promise<PlatformSetting | null> {
    const result = await db.select()
      .from(platformSettings)
      .where(and(
        eq(platformSettings.category, category),
        eq(platformSettings.key, key),
        eq(platformSettings.environment, environment),
        eq(platformSettings.isActive, true)
      ))
      .limit(1);

    return result[0] || null;
  }

  async getSettingValue(category: string, key: string, environment: string = 'production'): Promise<any> {
    const setting = await this.getSetting(category, key, environment);
    if (!setting) return null;

    switch (setting.valueType) {
      case 'string':
        return setting.valueString;
      case 'number':
        return setting.valueNumber;
      case 'boolean':
        return setting.valueBoolean;
      case 'json':
      case 'array':
        return setting.valueJson;
      default:
        return null;
    }
  }

  // ==================== SETTINGS VALIDATION ====================

  async validateSetting(settingId: string, newValue: SettingValue): Promise<ValidationResult> {
    const setting = await db.select()
      .from(platformSettings)
      .where(eq(platformSettings.id, settingId))
      .limit(1);

    if (!setting[0]) {
      return {
        isValid: false,
        errors: ['Setting not found'],
        warnings: []
      };
    }

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate against setting's validation rules
    if (setting[0].validationRules) {
      const rules = setting[0].validationRules as any;
      const value = this.extractValueByType(newValue, setting[0].valueType);

      // Required validation
      if (rules.required && (value === null || value === undefined || value === '')) {
        result.errors.push('This setting is required');
        result.isValid = false;
      }

      // Type-specific validations
      if (value !== null && value !== undefined) {
        switch (setting[0].valueType) {
          case 'string':
            if (rules.maxLength && value.length > rules.maxLength) {
              result.errors.push(`Maximum length is ${rules.maxLength} characters`);
              result.isValid = false;
            }
            if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
              result.errors.push('Value does not match required pattern');
              result.isValid = false;
            }
            if (rules.enum && !rules.enum.includes(value)) {
              result.errors.push(`Value must be one of: ${rules.enum.join(', ')}`);
              result.isValid = false;
            }
            break;

          case 'number':
            if (rules.min !== undefined && value < rules.min) {
              result.errors.push(`Minimum value is ${rules.min}`);
              result.isValid = false;
            }
            if (rules.max !== undefined && value > rules.max) {
              result.errors.push(`Maximum value is ${rules.max}`);
              result.isValid = false;
            }
            break;
        }
      }
    }

    // Validate against global validation rules
    const validationRules = await db.select()
      .from(platformSettingsValidation)
      .where(and(
        eq(platformSettingsValidation.isActive, true),
        sql`${platformSettingsValidation.appliesTo} ? ${setting[0].category + '.' + setting[0].key}`
      ));

    for (const rule of validationRules) {
      const ruleResult = await this.applyValidationRule(rule, setting[0], newValue);
      if (!ruleResult.isValid) {
        if (rule.severity === 'error' || rule.severity === 'critical') {
          result.errors.push(rule.errorMessage);
          result.isValid = false;
        } else {
          result.warnings.push(rule.errorMessage);
        }
      }
    }

    return result;
  }

  private async applyValidationRule(
    rule: PlatformSettingsValidation, 
    setting: PlatformSetting, 
    newValue: SettingValue
  ): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };
    
    try {
      const logic = rule.validationLogic as any;
      const value = this.extractValueByType(newValue, setting.valueType);

      switch (rule.ruleType) {
        case 'range':
          if (typeof value === 'number') {
            if (logic.min !== undefined && value < logic.min) result.isValid = false;
            if (logic.max !== undefined && value > logic.max) result.isValid = false;
          }
          break;

        case 'business_rule':
          // Custom business rule validation
          if (rule.name === 'Commission Tier Consistency' && setting.key === 'tier_rates') {
            const rates = value as any;
            if (rates && typeof rates === 'object') {
              const { free, silver, gold, platinum } = rates;
              if (platinum > gold || gold > silver || silver > free) {
                result.isValid = false;
              }
            }
          }
          break;

        case 'dependency':
          // Check if dependent settings are properly configured
          const conditions = rule.conditions as any;
          if (conditions.dependencies) {
            for (const dep of conditions.dependencies) {
              const depSetting = await this.getSetting(dep.category, dep.key, setting.environment);
              if (!depSetting || !this.meetsDependencyCondition(depSetting, dep.condition)) {
                result.isValid = false;
              }
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error applying validation rule:', error);
      result.isValid = false;
      result.errors.push('Validation rule execution failed');
    }

    return result;
  }

  private extractValueByType(value: SettingValue, type: string): any {
    switch (type) {
      case 'string': return value.string;
      case 'number': return value.number;
      case 'boolean': return value.boolean;
      case 'json':
      case 'array': return value.json;
      default: return null;
    }
  }

  private meetsDependencyCondition(setting: PlatformSetting, condition: any): boolean {
    const value = this.extractValueByType({
      string: setting.valueString,
      number: setting.valueNumber,
      boolean: setting.valueBoolean,
      json: setting.valueJson
    }, setting.valueType);

    // Simple condition checking - can be extended
    if (condition.equals !== undefined) return value === condition.equals;
    if (condition.greaterThan !== undefined) return value > condition.greaterThan;
    if (condition.lessThan !== undefined) return value < condition.lessThan;
    
    return true;
  }

  // ==================== IMPACT ANALYSIS ====================

  async analyzeImpact(settingId: string, newValue: SettingValue): Promise<ImpactAnalysis> {
    const setting = await db.select()
      .from(platformSettings)
      .where(eq(platformSettings.id, settingId))
      .limit(1);

    if (!setting[0]) {
      throw new Error('Setting not found');
    }

    const impacts = await db.select()
      .from(platformSettingsImpact)
      .where(eq(platformSettingsImpact.settingId, settingId));

    const analysis: ImpactAnalysis = {
      severity: 'low',
      affectedSystems: [],
      affectedUsers: [],
      rollbackComplexity: 'simple',
      recommendations: []
    };

    // Analyze based on setting category and type
    const affects = setting[0].affects as string[] || [];
    analysis.affectedSystems = affects;

    // Determine severity based on setting importance and scope
    if (setting[0].category === 'security' || setting[0].isSensitive) {
      analysis.severity = 'high';
      analysis.rollbackComplexity = 'moderate';
    }

    if (setting[0].requiresRestart) {
      analysis.severity = analysis.severity === 'low' ? 'medium' : 'critical';
      analysis.estimatedDowntime = 300; // 5 minutes
      analysis.rollbackComplexity = 'complex';
    }

    // Add specific impact assessments
    for (const impact of impacts) {
      if (impact.severity === 'critical' || impact.severity === 'high') {
        analysis.severity = impact.severity as any;
      }
      analysis.affectedSystems.push(...(impact.affectedSystems as string[] || []));
      analysis.affectedUsers.push(...(impact.affectedUsers as string[] || []));
    }

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(setting[0], analysis);

    return analysis;
  }

  private generateRecommendations(setting: PlatformSetting, analysis: ImpactAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.severity === 'critical' || analysis.severity === 'high') {
      recommendations.push('Schedule this change during maintenance window');
      recommendations.push('Notify all stakeholders before applying changes');
    }

    if (setting.requiresRestart) {
      recommendations.push('Plan for system restart and potential downtime');
      recommendations.push('Prepare rollback plan before deployment');
    }

    if (setting.category === 'commission' || setting.category === 'payout') {
      recommendations.push('Verify financial calculations after change');
      recommendations.push('Monitor transaction processing closely');
    }

    if (analysis.affectedUsers.length > 0) {
      recommendations.push('Consider user communication and training needs');
    }

    return recommendations;
  }

  // ==================== SETTINGS MANAGEMENT ====================

  async updateSetting(request: SettingsChangeRequest): Promise<{ success: boolean; errors?: string[]; settingId?: string }> {
    try {
      // Validate the change
      const validation = await this.validateSetting(request.settingId, request.newValue);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Get current setting
      const currentSetting = await db.select()
        .from(platformSettings)
        .where(eq(platformSettings.id, request.settingId))
        .limit(1);

      if (!currentSetting[0]) {
        return { success: false, errors: ['Setting not found'] };
      }

      const setting = currentSetting[0];

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: request.requestedBy
      };

      // Set the appropriate value field based on type
      switch (setting.valueType) {
        case 'string':
          updateData.valueString = request.newValue.string;
          break;
        case 'number':
          updateData.valueNumber = request.newValue.number;
          break;
        case 'boolean':
          updateData.valueBoolean = request.newValue.boolean;
          break;
        case 'json':
        case 'array':
          updateData.valueJson = request.newValue.json;
          break;
      }

      // Update the setting
      await db.update(platformSettings)
        .set(updateData)
        .where(eq(platformSettings.id, request.settingId));

      // Record the change in history
      const historyData: InsertPlatformSettingsHistory = {
        settingId: request.settingId,
        action: 'update',
        previousValue: {
          string: setting.valueString,
          number: setting.valueNumber,
          boolean: setting.valueBoolean,
          json: setting.valueJson
        },
        newValue: request.newValue,
        changeReason: request.changeReason,
        createdBy: request.requestedBy,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        canRollback: true,
        rollbackData: {
          settingId: request.settingId,
          rollbackValue: {
            string: setting.valueString,
            number: setting.valueNumber,
            boolean: setting.valueBoolean,
            json: setting.valueJson
          }
        }
      };

      await db.insert(platformSettingsHistory).values(historyData);

      return { success: true, settingId: request.settingId };

    } catch (error) {
      console.error('Error updating setting:', error);
      return { success: false, errors: ['Failed to update setting'] };
    }
  }

  async createSetting(settingData: InsertPlatformSetting): Promise<{ success: boolean; errors?: string[]; settingId?: string }> {
    try {
      // Check if setting already exists
      const existing = await db.select()
        .from(platformSettings)
        .where(and(
          eq(platformSettings.category, settingData.category),
          eq(platformSettings.key, settingData.key),
          eq(platformSettings.environment, settingData.environment || 'production')
        ))
        .limit(1);

      if (existing.length > 0) {
        return { success: false, errors: ['Setting already exists'] };
      }

      // Insert new setting
      const result = await db.insert(platformSettings)
        .values(settingData)
        .returning({ id: platformSettings.id });

      // Record creation in history
      const historyData: InsertPlatformSettingsHistory = {
        settingId: result[0].id,
        action: 'create',
        previousValue: null,
        newValue: {
          string: settingData.valueString,
          number: settingData.valueNumber,
          boolean: settingData.valueBoolean,
          json: settingData.valueJson
        },
        changeReason: 'Setting created',
        createdBy: settingData.createdBy || 'system',
        canRollback: true
      };

      await db.insert(platformSettingsHistory).values(historyData);

      return { success: true, settingId: result[0].id };

    } catch (error) {
      console.error('Error creating setting:', error);
      return { success: false, errors: ['Failed to create setting'] };
    }
  }

  // ==================== ROLLBACK FUNCTIONALITY ====================

  async rollbackSetting(historyId: string, requestedBy: string): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // Get the history record
      const history = await db.select()
        .from(platformSettingsHistory)
        .where(eq(platformSettingsHistory.id, historyId))
        .limit(1);

      if (!history[0] || !history[0].canRollback) {
        return { success: false, errors: ['Cannot rollback this change'] };
      }

      const rollbackData = history[0].rollbackData as any;
      if (!rollbackData || !rollbackData.rollbackValue) {
        return { success: false, errors: ['No rollback data available'] };
      }

      // Perform the rollback
      const request: SettingsChangeRequest = {
        settingId: rollbackData.settingId,
        newValue: rollbackData.rollbackValue,
        changeReason: `Rollback of change from ${history[0].createdAt}`,
        requestedBy
      };

      const result = await this.updateSetting(request);
      
      if (result.success) {
        // Mark the original change as rolled back
        await db.update(platformSettingsHistory)
          .set({ canRollback: false })
          .where(eq(platformSettingsHistory.id, historyId));
      }

      return result;

    } catch (error) {
      console.error('Error rolling back setting:', error);
      return { success: false, errors: ['Failed to rollback setting'] };
    }
  }

  // ==================== SETTINGS HISTORY ====================

  async getSettingHistory(settingId: string, limit: number = 50): Promise<PlatformSettingsHistory[]> {
    return await db.select()
      .from(platformSettingsHistory)
      .where(eq(platformSettingsHistory.settingId, settingId))
      .orderBy(desc(platformSettingsHistory.createdAt))
      .limit(limit);
  }

  async getRecentChanges(limit: number = 100): Promise<PlatformSettingsHistory[]> {
    return await db.select()
      .from(platformSettingsHistory)
      .orderBy(desc(platformSettingsHistory.createdAt))
      .limit(limit);
  }

  // ==================== BULK OPERATIONS ====================

  async bulkUpdateSettings(
    updates: SettingsChangeRequest[], 
    requestedBy: string
  ): Promise<{ success: boolean; results: any[]; errors?: string[] }> {
    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const result = await this.updateSetting(update);
        results.push({ settingId: update.settingId, ...result });
        
        if (!result.success) {
          errors.push(`Setting ${update.settingId}: ${result.errors?.join(', ')}`);
        }
      } catch (error) {
        errors.push(`Setting ${update.settingId}: ${error}`);
        results.push({ settingId: update.settingId, success: false });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // ==================== CONFIGURATION EXPORT/IMPORT ====================

  async exportConfiguration(environment: string = 'production'): Promise<any> {
    const settings = await this.getAllSettings(environment);
    
    return {
      environment,
      exportedAt: new Date(),
      settings: settings.map(setting => ({
        category: setting.category,
        key: setting.key,
        name: setting.name,
        description: setting.description,
        valueType: setting.valueType,
        value: this.extractValueByType({
          string: setting.valueString,
          number: setting.valueNumber,
          boolean: setting.valueBoolean,
          json: setting.valueJson
        }, setting.valueType),
        validationRules: setting.validationRules,
        dependencies: setting.dependencies,
        affects: setting.affects
      }))
    };
  }

  async importConfiguration(
    configData: any, 
    targetEnvironment: string, 
    requestedBy: string
  ): Promise<{ success: boolean; imported: number; errors?: string[] }> {
    const errors = [];
    let imported = 0;

    for (const settingConfig of configData.settings) {
      try {
        // Check if setting exists
        const existing = await this.getSetting(
          settingConfig.category, 
          settingConfig.key, 
          targetEnvironment
        );

        const settingData: InsertPlatformSetting = {
          category: settingConfig.category,
          key: settingConfig.key,
          name: settingConfig.name,
          description: settingConfig.description,
          valueType: settingConfig.valueType,
          environment: targetEnvironment,
          validationRules: settingConfig.validationRules,
          dependencies: settingConfig.dependencies,
          affects: settingConfig.affects,
          createdBy: requestedBy
        };

        // Set value based on type
        switch (settingConfig.valueType) {
          case 'string':
            settingData.valueString = settingConfig.value;
            break;
          case 'number':
            settingData.valueNumber = settingConfig.value;
            break;
          case 'boolean':
            settingData.valueBoolean = settingConfig.value;
            break;
          case 'json':
          case 'array':
            settingData.valueJson = settingConfig.value;
            break;
        }

        if (existing) {
          // Update existing setting
          const request: SettingsChangeRequest = {
            settingId: existing.id,
            newValue: {
              string: settingData.valueString,
              number: settingData.valueNumber,
              boolean: settingData.valueBoolean,
              json: settingData.valueJson
            },
            changeReason: 'Configuration import',
            requestedBy
          };

          const result = await this.updateSetting(request);
          if (result.success) {
            imported++;
          } else {
            errors.push(`${settingConfig.category}.${settingConfig.key}: ${result.errors?.join(', ')}`);
          }
        } else {
          // Create new setting
          const result = await this.createSetting(settingData);
          if (result.success) {
            imported++;
          } else {
            errors.push(`${settingConfig.category}.${settingConfig.key}: ${result.errors?.join(', ')}`);
          }
        }

      } catch (error) {
        errors.push(`${settingConfig.category}.${settingConfig.key}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      imported,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

export const platformSettingsService = new PlatformSettingsService();