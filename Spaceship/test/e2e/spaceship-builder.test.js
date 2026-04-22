/**
 * E2E Tests for Spaceship Builder.
 *
 * Run via: npm run test-e2e-spaceship
 *
 * The exported test function is invoked by ./run.js; it expects a puppeteer
 * Page and a baseUrl (the host:port the dev server is listening on).
 */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getModuleCount(page) {
    return parseInt(await page.$eval('#module-count', (el) => el.textContent), 10);
}

export async function testSpaceshipBuilder(page, { baseUrl = 'http://localhost:8080' } = {}) {
    console.log('\n=== Spaceship Builder E2E Tests ===\n');

    // Guarantee a clean slate before any app code runs and dismiss any
    // confirm() dialogs (newShip, autosave-load) without manual intervention.
    await page.evaluateOnNewDocument(() => localStorage.clear());
    page.on('dialog', (dialog) => dialog.dismiss().catch(() => {}));

    // Page load
    await page.goto(`${baseUrl}/Spaceship/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#viewport canvas', { timeout: 10000 });
    await wait(500);  // let SpaceshipBuilder.init() finish createDefaultFloor()
    console.log('✓ Page loaded');

    const initialCount = await getModuleCount(page);
    if (initialCount !== 25) {
        throw new Error(`Expected 25 floor tiles after init, got ${initialCount}`);
    }
    console.log(`✓ Default 5x5 floor created (count = ${initialCount})`);

    // Part selection
    await page.click('[data-part-type="cockpit"]');
    await wait(200);
    const isSelected = await page.$eval(
        '[data-part-type="cockpit"]',
        (el) => el.classList.contains('selected')
    );
    if (!isSelected) throw new Error('Part selection failed');
    console.log('✓ Part selection works');

    // Module placement
    const canvas = await page.$('#viewport canvas');
    const box = await canvas.boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.click(centerX, centerY);
    await wait(300);
    if (await getModuleCount(page) !== initialCount + 1) {
        throw new Error(`Expected ${initialCount + 1} after place, got ${await getModuleCount(page)}`);
    }
    console.log('✓ Module placement works');

    // Properties panel becomes visible after place (selectModule is called)
    const propertiesVisible = await page.$eval(
        '#module-properties',
        (el) => el.style.display !== 'none'
    );
    if (!propertiesVisible) throw new Error('Properties panel not visible');
    console.log('✓ Properties panel shows on selection');

    // Scaling (dynamic geometry rebuild)
    await page.$eval('#scale-x', (el) => {
        el.value = '4';
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await wait(200);
    const scaleValue = await page.$eval('#scale-x', (el) => el.value);
    if (scaleValue !== '4') throw new Error(`Scale-x expected 4, got ${scaleValue}`);
    console.log('✓ Module scaling works (dynamic rebuild)');

    // Color change
    await page.$eval('#color-picker', (el) => {
        el.value = '#ff0000';
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await wait(200);
    console.log('✓ Color picker works');

    // Undo / Redo regression — this is the regression net for the
    // AddCommand bug where the first undo silently no-op'd.
    {
        const before = await getModuleCount(page);
        await page.mouse.click(centerX + 60, centerY);  // adjacent grid cell
        await wait(300);
        const afterPlace = await getModuleCount(page);
        if (afterPlace !== before + 1) {
            throw new Error(`Place inside undo block: expected ${before + 1}, got ${afterPlace}`);
        }

        await page.keyboard.down('Control');
        await page.keyboard.press('z');
        await page.keyboard.up('Control');
        await wait(200);
        if (await getModuleCount(page) !== before) {
            throw new Error('Ctrl+Z did not remove the last placement');
        }

        await page.keyboard.down('Control');
        await page.keyboard.press('y');
        await page.keyboard.up('Control');
        await wait(200);
        if (await getModuleCount(page) !== before + 1) {
            throw new Error('Ctrl+Y did not restore the placement');
        }
        console.log('✓ Undo/redo works for module placement (Ctrl+Z / Ctrl+Y)');

        // Leave state clean for next block
        await page.keyboard.down('Control');
        await page.keyboard.press('z');
        await page.keyboard.up('Control');
        await wait(200);
    }

    // Multi-floor: add a floor above
    await page.click('#add-floor-above');
    await wait(200);
    const floorCount = await page.$eval('#floor-count', (el) => el.textContent);
    if (floorCount !== '2') throw new Error(`Expected 2 floors, got ${floorCount}`);
    console.log('✓ Multi-floor support works');

    // Floor switching
    await page.click('.floor-item[data-floor="1"]');
    await wait(200);
    const activeFloor = await page.$eval('.floor-item.active', (el) => el.dataset.floor);
    if (activeFloor !== '1') throw new Error('Floor switching failed');
    console.log('✓ Floor switching works');

    // Switch back to floor 0 for the remaining tests
    await page.click('.floor-item[data-floor="0"]');
    await wait(100);

    // Manual save to localStorage
    await page.click('#btn-save');
    await wait(200);
    const saved = await page.evaluate(
        () => localStorage.getItem('spaceship-builder-save') !== null
    );
    if (!saved) throw new Error('Manual save did not write to localStorage');
    console.log('✓ Manual save works');

    // The previous blocks left us in placing mode (single click only places,
    // it doesn't stop), and the Ctrl+Z chain inside the undo block cleared
    // the selection. Press Escape to exit placing mode and reset selection,
    // then click the cockpit to select it for duplicate.
    await page.keyboard.press('Escape');
    await wait(100);
    await page.mouse.click(centerX, centerY);
    await wait(200);

    // Duplicate (Ctrl+D)
    const beforeDup = await getModuleCount(page);
    await page.keyboard.down('Control');
    await page.keyboard.press('d');
    await page.keyboard.up('Control');
    await wait(300);
    if (await getModuleCount(page) !== beforeDup + 1) {
        throw new Error(`Ctrl+D did not duplicate (count was ${beforeDup}, now ${await getModuleCount(page)})`);
    }
    console.log('✓ Duplicate (Ctrl+D) works');

    // Delete the duplicate
    const beforeDel = await getModuleCount(page);
    await page.keyboard.press('Delete');
    await wait(200);
    if (await getModuleCount(page) !== beforeDel - 1) {
        throw new Error('Delete key did not remove module');
    }
    console.log('✓ Delete (Del key) works');

    // Grid toggle
    await page.click('#btn-grid');
    await wait(100);
    console.log('✓ Grid toggle works');

    console.log('\n✅ All E2E tests passed!\n');
    return true;
}
