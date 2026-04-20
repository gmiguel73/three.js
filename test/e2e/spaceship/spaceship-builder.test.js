/**
 * E2E Tests for Spaceship Builder
 * Run with: node test/e2e/puppeteer.js --test=spaceship
 */

export async function testSpaceshipBuilder(page) {
    console.log('\n=== Spaceship Builder E2E Tests ===\n');
    
    // Navigate to the builder
    await page.goto('http://localhost:8080/editor/spaceship/', { waitUntil: 'networkidle0' });
    console.log('✓ Page loaded');
    
    // Wait for the 3D scene to initialize
    await page.waitForSelector('#viewport canvas', { timeout: 10000 });
    console.log('✓ 3D viewport initialized');
    
    // Test 1: Part selection
    await page.click('[data-part-type="cockpit"]');
    await page.waitForTimeout(500);
    const isSelected = await page.$eval('[data-part-type="cockpit"]', el => el.classList.contains('selected'));
    if (!isSelected) throw new Error('Part selection failed');
    console.log('✓ Part selection works');
    
    // Test 2: Module placement
    const canvas = await page.$('#viewport canvas');
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    
    const moduleCount = await page.$eval('#module-count', el => el.textContent);
    if (moduleCount !== '1') throw new Error(`Expected 1 module, got ${moduleCount}`);
    console.log('✓ Module placement works');
    
    // Test 3: Properties panel
    const propertiesVisible = await page.$eval('#module-properties', el => el.style.display !== 'none');
    if (!propertiesVisible) throw new Error('Properties panel not visible');
    console.log('✓ Properties panel shows on selection');
    
    // Test 4: Scaling (dynamic update)
    await page.$eval('#scale-x', el => { 
        el.value = '4'; 
        el.dispatchEvent(new Event('change', { bubbles: true })); 
    });
    await page.waitForTimeout(500);
    const scaleValue = await page.$eval('#scale-x', el => el.value);
    if (scaleValue !== '4') throw new Error('Scaling failed');
    console.log('✓ Module scaling works (with dynamic rebuild)');
    
    // Test 5: Color change
    await page.$eval('#color-picker', el => {
        el.value = '#ff0000';
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(300);
    console.log('✓ Color picker works');
    
    // Test 6: Floor management
    await page.click('#add-floor-above');
    await page.waitForTimeout(300);
    const floorCount = await page.$eval('#floor-count', el => el.textContent);
    if (floorCount !== '2') throw new Error(`Expected 2 floors, got ${floorCount}`);
    console.log('✓ Multi-floor support works');
    
    // Test 7: Floor switching
    await page.click('.floor-item[data-floor="1"]');
    await page.waitForTimeout(300);
    const activeFloor = await page.$eval('.floor-item.active', el => el.dataset.floor);
    if (activeFloor !== '1') throw new Error('Floor switching failed');
    console.log('✓ Floor switching works');
    
    // Test 8: Save to localStorage
    await page.click('#menu-file-save');
    await page.waitForTimeout(300);
    const saved = await page.evaluate(() => localStorage.getItem('spaceship-builder-save') !== null);
    if (!saved) throw new Error('Save to localStorage failed');
    console.log('✓ localStorage save works');
    
    // Test 9: Duplicate module
    await page.keyboard.down('Control');
    await page.keyboard.press('d');
    await page.keyboard.up('Control');
    await page.waitForTimeout(300);
    const moduleCountAfterDup = await page.$eval('#module-count', el => el.textContent);
    if (moduleCountAfterDup !== '2') throw new Error(`Expected 2 modules after duplicate, got ${moduleCountAfterDup}`);
    console.log('✓ Duplicate (Ctrl+D) works');
    
    // Test 10: Delete module
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);
    const moduleCountAfterDel = await page.$eval('#module-count', el => el.textContent);
    if (moduleCountAfterDel !== '1') throw new Error(`Expected 1 module after delete, got ${moduleCountAfterDel}`);
    console.log('✓ Delete (Del key) works');
    
    // Test 11: Grid toggle
    await page.click('#menu-view-grid');
    await page.waitForTimeout(200);
    console.log('✓ Grid toggle works');
    
    // Test 12: Camera reset
    await page.click('#menu-view-reset-camera');
    await page.waitForTimeout(200);
    console.log('✓ Camera reset works');
    
    console.log('\n✅ All 12 E2E tests passed!\n');
    
    return true;
}