import 'dotenv/config';
import { adminAccessControlService } from './server/adminAccessControlService';

async function testAdminAccessControl() {
  try {
    console.log('Testing Admin Access Control System...');
    
    // Test getting all roles
    console.log('\n1. Getting all roles...');
    const roles = await adminAccessControlService.getAllRoles();
    console.log(`Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`  - ${role.displayName} (${role.name}) - Level: ${role.level}`);
    });
    
    // Test getting role hierarchy
    console.log('\n2. Getting role hierarchy...');
    const hierarchy = await adminAccessControlService.getRoleHierarchy();
    console.log('Role hierarchy:', JSON.stringify(hierarchy, null, 2));
    
    // Test getting permission resources
    console.log('\n3. Getting permission resources...');
    const resources = await adminAccessControlService.getAllPermissionResources();
    console.log(`Found ${resources.length} permission resources:`);
    resources.forEach(resource => {
      console.log(`  - ${resource.displayName} (${resource.name})`);
    });
    
    console.log('\n✅ Admin Access Control System test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminAccessControl();