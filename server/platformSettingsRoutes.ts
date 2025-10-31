import { Router } from "express";
import { authMiddleware } from "./auth";
import { platformSettingsService, type SettingsChangeRequest } from "./platformSettingsService";
import { insertActivityLogSchema, activity_logs } from "@shared/schema";
import { db } from "./db";
import { z } from "zod";

const router = Router();

// ==================== SETTINGS RETRIEVAL ====================

// GET /api/admin/settings/platform-configuration - Get all platform settings
router.get("/platform-configuration", authMiddleware, async (req, res) => {
  try {
    const { environment = 'production', category } = req.query;

    let settings;
    if (category) {
      settings = await platformSettingsService.getSettingsByCategory(
        category as string, 
        environment as string
      );
    } else {
      settings = await platformSettingsService.getAllSettings(environment as string);
    }

    // Group settings by category for better organization
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push({
        id: setting.id,
        key: setting.key,
        name: setting.name,
        description: setting.description,
        valueType: setting.valueType,
        value: setting.valueType === 'string' ? setting.valueString :
               setting.valueType === 'number' ? setting.valueNumber :
               setting.valueType === 'boolean' ? setting.valueBoolean :
               setting.valueJson,
        defaultValue: setting.defaultValue,
        validationRules: setting.validationRules,
        environment: setting.environment,
        requiresRestart: setting.requiresRestart,
        isSensitive: setting.isSensitive,
        dependencies: setting.dependencies,
        affects: setting.affects,
        isReadonly: setting.isReadonly,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Log admin activity
    await db.insert(activity_logs).values({
      adminId: req.user!.id,
      adminName: req.user!.firstName + ' ' + req.user!.lastName,
      action: 'view_platform_settings',
      description: `Viewed platform settings for environment: ${environment}`,
      entityType: 'platform_settings',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      settings: groupedSettings,
      environment,
      totalSettings: settings.length
    });

  } catch (error: any) {
    console.error('Error fetching platform settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch platform settings' 
    });
  }
});

// GET /api/admin/settings/platform-configuration/:category/:key - Get specific setting
router.get("/platform-configuration/:category/:key", authMiddleware, async (req, res) => {
  try {
    const { category, key } = req.params;
    const { environment = 'production' } = req.query;

    const setting = await platformSettingsService.getSetting(
      category, 
      key, 
      environment as string
    );

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    // Get setting history
    const history = await platformSettingsService.getSettingHistory(setting.id, 10);

    // Get impact analysis for current value
    const currentValue = {
      string: setting.valueString,
      number: setting.valueNumber,
      boolean: setting.valueBoolean,
      json: setting.valueJson
    };

    const impact = await platformSettingsService.analyzeImpact(setting.id, currentValue);

    res.json({
      success: true,
      setting: {
        id: setting.id,
        category: setting.category,
        key: setting.key,
        name: setting.name,
        description: setting.description,
        valueType: setting.valueType,
        value: setting.valueType === 'string' ? setting.valueString :
               setting.valueType === 'number' ? setting.valueNumber :
               setting.valueType === 'boolean' ? setting.valueBoolean :
               setting.valueJson,
        defaultValue: setting.defaultValue,
        validationRules: setting.validationRules,
        environment: setting.environment,
        requiresRestart: setting.requiresRestart,
        isSensitive: setting.isSensitive,
        dependencies: setting.dependencies,
        affects: setting.affects,
        isReadonly: setting.isReadonly,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy
      },
      history,
      impact
    });

  } catch (error: any) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch setting' 
    });
  }
});

// ==================== SETTINGS VALIDATION ====================

// POST /api/admin/settings/platform-configuration/validate - Validate setting change
router.post("/platform-configuration/validate", authMiddleware, async (req, res) => {
  try {
    const { settingId, newValue } = req.body;

    if (!settingId || newValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Setting ID and new value are required'
      });
    }

    // Validate the setting change
    const validation = await platformSettingsService.validateSetting(settingId, newValue);

    // Analyze impact
    const impact = await platformSettingsService.analyzeImpact(settingId, newValue);

    res.json({
      success: true,
      validation,
      impact
    });

  } catch (error: any) {
    console.error('Error validating setting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate setting' 
    });
  }
});

// ==================== SETTINGS MANAGEMENT ====================

// PUT /api/admin/settings/platform-configuration - Update platform settings
router.put("/platform-configuration", authMiddleware, async (req, res) => {
  try {
    const { settingId, newValue, changeReason } = req.body;

    if (!settingId || newValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Setting ID and new value are required'
      });
    }

    if (!changeReason) {
      return res.status(400).json({
        success: false,
        error: 'Change reason is required'
      });
    }

    const request: SettingsChangeRequest = {
      settingId,
      newValue,
      changeReason,
      requestedBy: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const result = await platformSettingsService.updateSetting(request);

    if (result.success) {
      // Log admin activity
      await db.insert(activity_logs).values({
        adminId: req.user!.id,
        adminName: req.user!.firstName + ' ' + req.user!.lastName,
        action: 'update_platform_setting',
        description: `Updated platform setting: ${changeReason}`,
        entityType: 'platform_settings',
        entityId: settingId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Setting updated successfully',
        settingId: result.settingId
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }

  } catch (error: any) {
    console.error('Error updating setting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update setting' 
    });
  }
});

// POST /api/admin/settings/platform-configuration/bulk-update - Bulk update settings
router.post("/platform-configuration/bulk-update", authMiddleware, async (req, res) => {
  try {
    const { updates, changeReason } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Updates array is required'
      });
    }

    if (!changeReason) {
      return res.status(400).json({
        success: false,
        error: 'Change reason is required'
      });
    }

    // Prepare requests
    const requests: SettingsChangeRequest[] = updates.map(update => ({
      settingId: update.settingId,
      newValue: update.newValue,
      changeReason: `${changeReason} (Bulk update)`,
      requestedBy: req.user!.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }));

    const result = await platformSettingsService.bulkUpdateSettings(requests, req.user!.id);

    // Log admin activity
    await db.insert(activity_logs).values({
      adminId: req.user!.id,
      adminName: req.user!.firstName + ' ' + req.user!.lastName,
      action: 'bulk_update_platform_settings',
      description: `Bulk updated ${updates.length} platform settings: ${changeReason}`,
      entityType: 'platform_settings',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: result.success,
      results: result.results,
      errors: result.errors,
      totalUpdated: result.results.filter(r => r.success).length,
      totalFailed: result.results.filter(r => !r.success).length
    });

  } catch (error: any) {
    console.error('Error bulk updating settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to bulk update settings' 
    });
  }
});

// ==================== SETTINGS HISTORY ====================

// GET /api/admin/settings/platform-configuration/:settingId/history - Get setting history
router.get("/platform-configuration/:settingId/history", authMiddleware, async (req, res) => {
  try {
    const { settingId } = req.params;
    const { limit = '50' } = req.query;

    const history = await platformSettingsService.getSettingHistory(
      settingId, 
      parseInt(limit as string)
    );

    res.json({
      success: true,
      history: history.map(h => ({
        id: h.id,
        action: h.action,
        previousValue: h.previousValue,
        newValue: h.newValue,
        changeReason: h.changeReason,
        createdBy: h.createdBy,
        createdAt: h.createdAt,
        canRollback: h.canRollback,
        ipAddress: h.ipAddress
      }))
    });

  } catch (error: any) {
    console.error('Error fetching setting history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch setting history' 
    });
  }
});

// GET /api/admin/settings/platform-configuration/recent-changes - Get recent changes
router.get("/platform-configuration/recent-changes", authMiddleware, async (req, res) => {
  try {
    const { limit = '100' } = req.query;

    const changes = await platformSettingsService.getRecentChanges(parseInt(limit as string));

    res.json({
      success: true,
      changes: changes.map(c => ({
        id: c.id,
        settingId: c.settingId,
        action: c.action,
        changeReason: c.changeReason,
        createdBy: c.createdBy,
        createdAt: c.createdAt,
        canRollback: c.canRollback
      }))
    });

  } catch (error: any) {
    console.error('Error fetching recent changes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch recent changes' 
    });
  }
});

// ==================== ROLLBACK FUNCTIONALITY ====================

// POST /api/admin/settings/platform-configuration/rollback - Rollback setting change
router.post("/platform-configuration/rollback", authMiddleware, async (req, res) => {
  try {
    const { historyId, confirmRollback } = req.body;

    if (!historyId) {
      return res.status(400).json({
        success: false,
        error: 'History ID is required'
      });
    }

    if (!confirmRollback) {
      return res.status(400).json({
        success: false,
        error: 'Rollback confirmation is required'
      });
    }

    const result = await platformSettingsService.rollbackSetting(historyId, req.user!.id);

    if (result.success) {
      // Log admin activity
      await db.insert(activity_logs).values({
        adminId: req.user!.id,
        adminName: req.user!.firstName + ' ' + req.user!.lastName,
        action: 'rollback_platform_setting',
        description: `Rolled back platform setting change (History ID: ${historyId})`,
        entityType: 'platform_settings',
        entityId: historyId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Setting rolled back successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }

  } catch (error: any) {
    console.error('Error rolling back setting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to rollback setting' 
    });
  }
});

// ==================== CONFIGURATION EXPORT/IMPORT ====================

// GET /api/admin/settings/platform-configuration/export - Export configuration
router.get("/platform-configuration/export", authMiddleware, async (req, res) => {
  try {
    const { environment = 'production' } = req.query;

    const config = await platformSettingsService.exportConfiguration(environment as string);

    // Log admin activity
    await db.insert(activity_logs).values({
      adminId: req.user!.id,
      adminName: req.user!.firstName + ' ' + req.user!.lastName,
      action: 'export_platform_configuration',
      description: `Exported platform configuration for environment: ${environment}`,
      entityType: 'platform_settings',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      configuration: config
    });

  } catch (error: any) {
    console.error('Error exporting configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export configuration' 
    });
  }
});

// POST /api/admin/settings/platform-configuration/import - Import configuration
router.post("/platform-configuration/import", authMiddleware, async (req, res) => {
  try {
    const { configuration, targetEnvironment = 'production', confirmImport } = req.body;

    if (!configuration) {
      return res.status(400).json({
        success: false,
        error: 'Configuration data is required'
      });
    }

    if (!confirmImport) {
      return res.status(400).json({
        success: false,
        error: 'Import confirmation is required'
      });
    }

    const result = await platformSettingsService.importConfiguration(
      configuration,
      targetEnvironment,
      req.user!.id
    );

    // Log admin activity
    await db.insert(activity_logs).values({
      adminId: req.user!.id,
      adminName: req.user!.firstName + ' ' + req.user!.lastName,
      action: 'import_platform_configuration',
      description: `Imported platform configuration to environment: ${targetEnvironment}. Imported: ${result.imported} settings`,
      entityType: 'platform_settings',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: result.success,
      imported: result.imported,
      errors: result.errors
    });

  } catch (error: any) {
    console.error('Error importing configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import configuration' 
    });
  }
});

// ==================== IMPACT ANALYSIS ====================

// POST /api/admin/settings/platform-configuration/analyze-impact - Analyze setting change impact
router.post("/platform-configuration/analyze-impact", authMiddleware, async (req, res) => {
  try {
    const { settingId, newValue } = req.body;

    if (!settingId || newValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Setting ID and new value are required'
      });
    }

    const impact = await platformSettingsService.analyzeImpact(settingId, newValue);

    res.json({
      success: true,
      impact
    });

  } catch (error: any) {
    console.error('Error analyzing impact:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze impact' 
    });
  }
});

export { router as platformSettingsRoutes };