import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Create screenshots directory
const screenshotsDir = path.join(process.cwd(), 'deliverables', 'Phase-2-Design', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Viewport configurations
const viewports = {
  mobile: { width: 375, height: 812, name: 'mobile' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  desktop: { width: 1920, height: 1080, name: 'desktop' }
};

// Test suite for capturing design screenshots
test.describe('EDMECA Website Design Documentation Screenshots', () => {
  
  test.beforeEach(async ({ page }) => {
    // Wait for page to be ready
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ============================================================
  // TASK 2.1: DESIGN SYSTEM & BRAND GUIDELINES
  // ============================================================
  test('2.1 - Design System - Color Palette', async ({ page }) => {
    // Navigate to home page (which uses our design system)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture full page showing color usage
    await page.screenshot({
      path: path.join(screenshotsDir, '2.1-design-system-colors.png'),
      fullPage: false
    });
    
    // Capture theme toggle functionality
    const themeToggle = page.locator('[data-theme-toggle], button:has-text("Toggle theme")').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
      await page.screenshot({
        path: path.join(screenshotsDir, '2.1-design-system-dark-mode.png'),
        fullPage: false
      });
      await themeToggle.click(); // Switch back
      await page.waitForTimeout(500);
    }
  });

  test('2.1 - Design System - Typography', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture heading hierarchy
    await page.screenshot({
      path: path.join(screenshotsDir, '2.1-design-system-typography.png'),
      fullPage: false
    });
  });

  test('2.1 - Design System - UI Components', async ({ page }) => {
    // Visit About page which has various components
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.1-design-system-components.png'),
      fullPage: true
    });
  });

  test('2.1 - Design System - Buttons & Interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture CTA buttons
    const ctaSection = page.locator('section').first();
    await ctaSection.screenshot({
      path: path.join(screenshotsDir, '2.1-design-system-buttons.png')
    });
  });

  // ============================================================
  // TASK 2.2: LANDING PAGE WIREFRAMES
  // ============================================================
  test('2.2 - Landing Page - Desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.2-landing-page-desktop.png'),
      fullPage: true
    });
  });

  test('2.2 - Landing Page - Tablet', async ({ page }) => {
    await page.setViewportSize(viewports.tablet);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.2-landing-page-tablet.png'),
      fullPage: true
    });
  });

  test('2.2 - Landing Page - Mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.2-landing-page-mobile.png'),
      fullPage: true
    });
  });

  test('2.2 - Landing Page - Hero Section', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture just the hero section
    const hero = page.locator('section').first();
    await hero.screenshot({
      path: path.join(screenshotsDir, '2.2-landing-page-hero.png')
    });
  });

  // ============================================================
  // TASK 2.3: PORTAL DASHBOARD DESIGN
  // ============================================================
  test('2.3 - Portal Dashboard - Desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    
    // Try to access portal (may need auth)
    try {
      await page.goto('/portal/dashboard');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({
        path: path.join(screenshotsDir, '2.3-portal-dashboard-desktop.png'),
        fullPage: true
      });
    } catch (e) {
      console.log('Portal requires auth - capturing login page');
      await page.screenshot({
        path: path.join(screenshotsDir, '2.3-portal-login-page.png'),
        fullPage: true
      });
    }
  });

  test('2.3 - Portal Tools - BMC Tool', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    
    try {
      await page.goto('/portal/bmc-tool');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({
        path: path.join(screenshotsDir, '2.3-portal-bmc-tool.png'),
        fullPage: true
      });
    } catch (e) {
      console.log('BMC Tool requires auth');
    }
  });

  // ============================================================
  // TASK 2.4: LEARNING TOOLS INTERFACE DESIGN
  // ============================================================
  test('2.4 - Solutions Page - Desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/solutions');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.4-solutions-page-desktop.png'),
      fullPage: true
    });
  });

  test('2.4 - Frameworks Page - Desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/frameworks');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.4-frameworks-page-desktop.png'),
      fullPage: true
    });
  });

  test('2.4 - Engagement Page - Desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/engagement');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.4-engagement-page-desktop.png'),
      fullPage: true
    });
  });

  // ============================================================
  // TASK 2.5: MOBILE RESPONSIVE DESIGN
  // ============================================================
  test('2.5 - Responsive - Navigation Mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture mobile navigation
    await page.screenshot({
      path: path.join(screenshotsDir, '2.5-responsive-nav-mobile-closed.png'),
      fullPage: false
    });
    
    // Try to open mobile menu
    const menuButton = page.locator('button[aria-label*="menu"], button:has-text("Menu")').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(screenshotsDir, '2.5-responsive-nav-mobile-open.png'),
        fullPage: false
      });
    }
  });

  test('2.5 - Responsive - Solutions Mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/solutions');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.5-responsive-solutions-mobile.png'),
      fullPage: true
    });
  });

  test('2.5 - Responsive - About Mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.5-responsive-about-mobile.png'),
      fullPage: true
    });
  });

  test('2.5 - Responsive - Contact Mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile);
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.5-responsive-contact-mobile.png'),
      fullPage: true
    });
  });

  test('2.5 - Responsive - Tablet Layout', async ({ page }) => {
    await page.setViewportSize(viewports.tablet);
    await page.goto('/solutions');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.5-responsive-tablet-layout.png'),
      fullPage: true
    });
  });

  // ============================================================
  // TASK 2.6: ACCESSIBILITY DESIGN GUIDELINES
  // ============================================================
  test('2.6 - Accessibility - Focus States', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.6-accessibility-focus-states.png'),
      fullPage: false
    });
  });

  test('2.6 - Accessibility - Color Contrast', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.6-accessibility-color-contrast.png'),
      fullPage: false
    });
  });

  test('2.6 - Accessibility - Text Readability', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.6-accessibility-text-readability.png'),
      fullPage: true
    });
  });

  // ============================================================
  // TASK 2.7: USER FLOW & NAVIGATION DESIGN
  // ============================================================
  test('2.7 - Navigation - Header Desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture header/navigation
    const header = page.locator('header, nav').first();
    await header.screenshot({
      path: path.join(screenshotsDir, '2.7-navigation-header-desktop.png')
    });
  });

  test('2.7 - Navigation - Footer', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    const footer = page.locator('footer').first();
    await footer.screenshot({
      path: path.join(screenshotsDir, '2.7-navigation-footer.png')
    });
  });

  test('2.7 - User Flow - Home to Solutions', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture home page
    await page.screenshot({
      path: path.join(screenshotsDir, '2.7-userflow-step1-home.png'),
      fullPage: false
    });
    
    // Navigate to solutions
    await page.click('a[href="/solutions"]');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.7-userflow-step2-solutions.png'),
      fullPage: false
    });
  });

  // ============================================================
  // TASK 2.8: INTERACTIVE PROTOTYPE
  // ============================================================
  test('2.8 - Interactive - Form Interactions', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.8-interactive-contact-form.png'),
      fullPage: true
    });
  });

  test('2.8 - Interactive - Hover States', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Hover over a button
    const button = page.locator('button, a[class*="button"]').first();
    await button.hover();
    await page.waitForTimeout(200);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '2.8-interactive-hover-states.png'),
      fullPage: false
    });
  });

  test('2.8 - Interactive - All Pages Overview', async ({ page }) => {
    await page.setViewportSize(viewports.desktop);
    
    const pages = ['/', '/about', '/solutions', '/frameworks', '/engagement', '/contact'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      const fileName = pagePath === '/' ? 'home' : pagePath.replace('/', '');
      await page.screenshot({
        path: path.join(screenshotsDir, `2.8-interactive-page-${fileName}.png`),
        fullPage: false
      });
    }
  });
});
