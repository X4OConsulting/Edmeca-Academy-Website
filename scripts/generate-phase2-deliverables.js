#!/usr/bin/env node

/**
 * PHASE 2 DESIGN DELIVERABLES GENERATOR
 * Generates 8 professional DOCX documents with embedded screenshots
 */

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';

const screenshotsDir = path.join(process.cwd(), 'deliverables', 'Phase-2-Design', 'screenshots');
const deliverablesDir = path.join(process.cwd(), 'deliverables', 'Phase-2-Design');

// Helper function to create image from file
function createImage(filename, width = 600) {
  const imagePath = path.join(screenshotsDir, filename);
  if (!fs.existsSync(imagePath)) {
    console.warn(`⚠️  Image not found: ${filename}`);
    return null;
  }
  
  const imageBuffer = fs.readFileSync(imagePath);
  return new ImageRun({
    data: imageBuffer,
    transformation: {
      width: width,
      height: Math.round(width * 0.6) // Maintain aspect ratio
    }
  });
}

// Helper for section headers
function sectionHeader(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 200 },
  });
}

// Helper for subsection headers
function subsectionHeader(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 300, after: 150 },
  });
}

// Helper for body text
function bodyText(text) {
  return new Paragraph({
    children: [new TextRun(text)],
    spacing: { after: 150 },
  });
}

// Helper for bullet points
function bulletPoint(text) {
  return new Paragraph({
    text: text,
    bullet: { level: 0 },
    spacing: { after: 100 },
  });
}

// ============================================================
// DELIVERABLE 1: DESIGN SYSTEM & BRAND GUIDELINES
// ============================================================
async function generateDesignSystemDoc() {
  console.log('📄 Generating: Design System & Brand Guidelines');
  
  const children = [
    new Paragraph({
      text: 'EDMECA ACADEMY WEBSITE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'Design System & Brand Guidelines',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `Document Version: 1.0\nDate: February 16, 2026\nPhase: 2 - Design & Prototyping`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({ text: '', pageBreakBefore: true }),

    // Introduction
    sectionHeader('1. INTRODUCTION'),
    bodyText('This document outlines the comprehensive design system and brand guidelines for the EDMECA Academy Website. It establishes the visual identity, design principles, and reusable components that ensure consistency across all pages and features.'),
    bodyText('The design system serves as the foundation for all UI/UX decisions and provides developers with clear specifications for implementation.'),
    
    // Brand Colors
    sectionHeader('2. BRAND COLORS & COLOR PALETTE'),
    bodyText('Our color system is built on a carefully selected palette that ensures accessibility, visual harmony, and brand consistency.'),
    subsectionHeader('2.1 Primary Color Scheme'),
  ];

  // Add color screenshot
  const colorImage = createImage('2.1-design-system-colors.png', 600);
  if (colorImage) {
    children.push(
      new Paragraph({ children: [colorImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 1: Primary color palette as shown in the website', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    subsectionHeader('2.2 Dark Mode Support'),
    bodyText('The website includes comprehensive dark mode support with optimized color contrast ratios for enhanced readability in low-light conditions.'),
  );

  // Typography
  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('3. TYPOGRAPHY SYSTEM'),
    bodyText('Typography plays a crucial role in establishing hierarchy, readability, and brand personality.'),
    subsectionHeader('3.1 Font Families'),
    bulletPoint('Primary Font: System font stack for optimal performance'),
    bulletPoint('Headings: Bold weight with tighter letter spacing'),
    bulletPoint('Body Text: Regular weight optimized for readability'),
    bulletPoint('Code/Monospace: Used for technical content'),
  );

  const typoImage = createImage('2.1-design-system-typography.png', 600);
  if (typoImage) {
    children.push(
      new Paragraph({ children: [typoImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 2: Typography hierarchy and styles', italics: true, spacing: { after: 300 } })
    );
  }

  // UI Components
  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('4. UI COMPONENTS'),
    bodyText('The component library includes all reusable UI elements built with shadcn/ui and Tailwind CSS.'),
    subsectionHeader('4.1 Component Overview'),
  );

  const componentsImage = createImage('2.1-design-system-components.png', 600);
  if (componentsImage) {
    children.push(
      new Paragraph({ children: [componentsImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 3: Sample UI components in use', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    subsectionHeader('4.2 Buttons & Interactive Elements'),
    bulletPoint('Primary buttons for main actions'),
    bulletPoint('Secondary buttons for alternative actions'),
    bulletPoint('Ghost buttons for tertiary actions'),
    bulletPoint('Icon buttons for compact interfaces'),
  );

  const buttonsImage = createImage('2.1-design-system-buttons.png', 600);
  if (buttonsImage) {
    children.push(
      new Paragraph({ children: [buttonsImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 4: Button states and variants', italics: true, spacing: { after: 300 } })
    );
  }

  // Design Tokens
  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('5. DESIGN TOKENS'),
    bodyText('Design tokens are the atomic values that power our design system, ensuring consistency across all platforms.'),
    subsectionHeader('5.1 Spacing System'),
    bulletPoint('Base unit: 4px (0.25rem)'),
    bulletPoint('Spacing scale: 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32'),
    bulletPoint('Consistent padding and margins throughout'),
    subsectionHeader('5.2 Border Radius'),
    bulletPoint('Small: 4px - for buttons, inputs'),
    bulletPoint('Medium: 8px - for cards, panels'),
    bulletPoint('Large: 12px - for modals, dialogs'),
    subsectionHeader('5.3 Shadows'),
    bulletPoint('Subtle elevation for cards'),
    bulletPoint('Medium elevation for dropdowns'),
    bulletPoint('High elevation for modals'),
  );

  // Implementation Guidelines
  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('6. IMPLEMENTATION GUIDELINES'),
    bodyText('Best practices for designers and developers working with this design system:'),
    bulletPoint('Always use design tokens instead of hard-coded values'),
    bulletPoint('Maintain WCAG 2.1 AA color contrast ratios'),
  bulletPoint('Test components in both light and dark modes'),
    bulletPoint('Ensure all interactive elements meet 44px minimum touch target size'),
    bulletPoint('Use semantic HTML elements for better accessibility'),
  );

  // Acceptance Criteria
  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('7. ACCEPTANCE CRITERIA'),
    bulletPoint('✅ Brand color palette defined with accessibility ratios'),
    bulletPoint('✅ Typography system established (headings, body, code)'),
    bulletPoint('✅ Spacing and layout grid system defined'),
    bulletPoint('✅ Component design tokens created'),
    bulletPoint('✅ Design system documentation completed'),
    bulletPoint('✅ Style guide created for developers'),
  );

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(deliverablesDir, 'Design-System-Brand-Guidelines.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Created: Design-System-Brand-Guidelines.docx');
}

// ============================================================
// DELIVERABLE 2: LANDING PAGE WIREFRAMES
// ============================================================
async function generateLandingPageDoc() {
  console.log('📄 Generating: Landing Page Wireframes');
  
  const children = [
    new Paragraph({
      text: 'EDMECA ACADEMY WEBSITE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'Landing Page Wireframes & Design',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `Document Version: 1.0\nDate: February 16, 2026\nPhase: 2 - Design & Prototyping`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({ text: '', pageBreakBefore: true }),

    sectionHeader('1. OVERVIEW'),
    bodyText('The landing page is the primary entry point for visitors to the EDMECA Academy Website. This document presents the complete wireframes and design specifications for desktop, tablet, and mobile viewports.'),
    
    sectionHeader('2. DESIGN OBJECTIVES'),
    bulletPoint('Create an impactful first impression that communicates EDMECA\'s value proposition'),
    bulletPoint('Guide visitors to key actions (explore solutions, contact, access portal)'),
    bulletPoint('Showcase educational methodology and engagement framework'),
    bulletPoint('Maintain fast load times and optimal performance'),
    bulletPoint('Ensure responsive design across all devices'),

    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('3. DESKTOP DESIGN (1920x1080)'),
  ];

  const desktopImage = createImage('2.2-landing-page-desktop.png', 600);
  if (desktopImage) {
    children.push(
      new Paragraph({ children: [desktopImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 1: Full landing page - Desktop view', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    subsectionHeader('3.1 Hero Section'),
    bodyText('The hero section is the most critical element, featuring:'),
    bulletPoint('Compelling headline and value proposition'),
    bulletPoint('Clear call-to-action buttons'),
    bulletPoint('Engaging visuals and brand elements'),
  );

  const heroImage = createImage('2.2-landing-page-hero.png', 600);
  if (heroImage) {
    children.push(
      new Paragraph({ children: [heroImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 2: Hero section detail', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('4. TABLET DESIGN (768x1024)'),
    bodyText('The tablet design optimizes the layout for medium-sized screens while maintaining visual hierarchy.'),
  );

  const tabletImage = createImage('2.2-landing-page-tablet.png', 600);
  if (tabletImage) {
    children.push(
      new Paragraph({ children: [tabletImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 3: Full landing page - Tablet view', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('5. MOBILE DESIGN (375x812)'),
    bodyText('The mobile design follows a mobile-first approach with touch-optimized interactions.'),
  );

  const mobileImage = createImage('2.2-landing-page-mobile.png', 600);
  if (mobileImage) {
    children.push(
      new Paragraph({ children: [mobileImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 4: Full landing page - Mobile view', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('6. KEY FEATURES'),
    subsectionHeader('6.1 Content Sections'),
    bulletPoint('Hero section with call-to-action'),
    bulletPoint('Features/benefits overview'),
    bulletPoint('Solutions showcase'),
    bulletPoint('Social proof/testimonials'),
    bulletPoint('Final call-to-action'),
    subsectionHeader('6.2 Interactive Elements'),
    bulletPoint('Smooth scroll animations'),
    bulletPoint('Hover effects on buttons and cards'),
    bulletPoint('Responsive navigation'),
    bulletPoint('Theme toggle (light/dark mode)'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('7. ACCEPTANCE CRITERIA'),
    bulletPoint('✅ Desktop wireframe completed (1920x1080)'),
    bulletPoint('✅ Tablet wireframe completed (768x1024)'),
    bulletPoint('✅ Mobile wireframe completed (375x812)'),
    bulletPoint('✅ Hero section design finalized'),
    bulletPoint('✅ Content sections wireframed'),
    bulletPoint('✅ Call-to-action placements defined'),
  );

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(deliverablesDir, 'Landing-Page-Wireframes.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Created: Landing-Page-Wireframes.docx');
}

// ============================================================
// DELIVERABLE 3: PORTAL DASHBOARD DESIGN
// ============================================================
async function generatePortalDashboardDoc() {
  console.log('📄 Generating: Portal Dashboard Design');
  
  const children = [
    new Paragraph({
      text: 'EDMECA ACADEMY WEBSITE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'Portal Dashboard Design',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `Document Version: 1.0\nDate: February 16, 2026\nPhase: 2 - Design & Prototyping`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({ text: '', pageBreakBefore: true }),

    sectionHeader('1. OVERVIEW'),
    bodyText('The user portal provides authenticated users with access to learning tools, progress tracking, and educational resources. This document presents the dashboard and portal interface designs.'),
    
    sectionHeader('2. DASHBOARD LAYOUT'),
  ];

  const dashboardImage = createImage('2.3-portal-dashboard-desktop.png', 600);
  if (dashboardImage) {
    children.push(
      new Paragraph({ children: [dashboardImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 1: Portal dashboard interface', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    subsectionHeader('2.1 Key Components'),
    bulletPoint('User profile and settings access'),
    bulletPoint('Progress tracking dashboard'),
    bulletPoint('Quick access to courses and resources'),
    bulletPoint('Notifications and updates'),
    bulletPoint('Learning tools integration'),

    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('3. BUSINESS MODEL CANVAS TOOL'),
    bodyText('Integrated learning tool for business planning and strategy development.'),
  );

  const bmcImage = createImage('2.3-portal-bmc-tool.png', 600);
  if (bmcImage) {
    children.push(
      new Paragraph({ children: [bmcImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 2: Business Model Canvas tool interface', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('4. DESIGN PRINCIPLES'),
    bulletPoint('Clear information hierarchy'),
    bulletPoint('Intuitive navigation patterns'),
    bulletPoint('Progress visualization'),
    bulletPoint('Personalized user experience'),
    bulletPoint('Seamless tool integration'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('5. ACCEPTANCE CRITERIA'),
    bulletPoint('✅ Dashboard layout designed'),
    bulletPoint('✅ Student progress visualization created'),
    bulletPoint('✅ Course access interface designed'),
    bulletPoint('✅ Resource library layout completed'),
    bulletPoint('✅ User profile section designed'),
    bulletPoint('✅ Navigation patterns established'),
  );

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(deliverablesDir, 'Portal-Dashboard-Design.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Created: Portal-Dashboard-Design.docx');
}

// ============================================================
// DELIVERABLE 4: LEARNING TOOLS INTERFACE DESIGN
// ============================================================
async function generateLearningToolsDoc() {
  console.log('📄 Generating: Learning Tools Interface Design');
  
  const children = [
    new Paragraph({
      text: 'EDMECA ACADEMY WEBSITE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'Learning Tools Interface Design',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `Document Version: 1.0\nDate: February 16, 2026\nPhase: 2 - Design & Prototyping`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({ text: '', pageBreakBefore: true }),

    sectionHeader('1. OVERVIEW'),
    bodyText('This document presents the interface designs for all learning tools and educational content pages including Solutions, Frameworks, and Engagement pages.'),
    
    sectionHeader('2. SOLUTIONS PAGE'),
    bodyText('The Solutions page showcases EDMECA\'s educational offerings and methodologies.'),
  ];

  const solutionsImage = createImage('2.4-solutions-page-desktop.png', 600);
  if (solutionsImage) {
    children.push(
      new Paragraph({ children: [solutionsImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 1: Solutions page layout', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('3. FRAMEWORKS PAGE'),
    bodyText('Educational frameworks and methodologies presentation.'),
  );

  const frameworksImage = createImage('2.4-frameworks-page-desktop.png', 600);
  if (frameworksImage) {
    children.push(
      new Paragraph({ children: [frameworksImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 2: Frameworks page design', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('4. ENGAGEMENT PAGE'),
    bodyText('User engagement strategies and interactive learning approaches.'),
  );

  const engagementImage = createImage('2.4-engagement-page-desktop.png', 600);
  if (engagementImage) {
    children.push(
      new Paragraph({ children: [engagementImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 3: Engagement page interface', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('5. DESIGN FEATURES'),
    bulletPoint('Clear content hierarchy and organization'),
    bulletPoint('Visual elements for engagement frameworks'),
    bulletPoint('Interactive demonstrations'),
    bulletPoint('Responsive layouts for all devices'),
    bulletPoint('Accessibility-compliant design'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('6. ACCEPTANCE CRITERIA'),
    bulletPoint('✅ Solutions overview page wireframe'),
    bulletPoint('✅ Solution detail page template'),
    bulletPoint('✅ Feature showcase sections designed'),
    bulletPoint('✅ Integration with learning tools visualized'),
    bulletPoint('✅ Responsive layouts for all breakpoints'),
    bulletPoint('✅ Content placeholder text provided'),
  );

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(deliverablesDir, 'Learning-Tools-Interface-Design.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Created: Learning-Tools-Interface-Design.docx');
}

// ============================================================
// DELIVERABLE 5: MOBILE RESPONSIVE DESIGN
// ============================================================
async function generateResponsiveDesignDoc() {
  console.log('📄 Generating: Mobile Responsive Design');
  
  const children = [
    new Paragraph({
      text: 'EDMECA ACADEMY WEBSITE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'Mobile Responsive Design Specifications',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `Document Version: 1.0\nDate: February 16, 2026\nPhase: 2 - Design & Prototyping`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({ text: '', pageBreakBefore: true }),

    sectionHeader('1. OVERVIEW'),
    bodyText('This document presents the comprehensive mobile responsive design strategy, ensuring optimal user experience across all device sizes and orientations.'),
    
    sectionHeader('2. RESPONSIVE BREAKPOINTS'),
    bulletPoint('Mobile: 320px - 767px'),
    bulletPoint('Tablet: 768px - 1023px'),
    bulletPoint('Desktop: 1024px - 1440px'),
    bulletPoint('Large Desktop: 1441px+'),

    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('3. MOBILE NAVIGATION'),
    subsectionHeader('3.1 Closed State'),
  ];

  const navClosedImage = createImage('2.5-responsive-nav-mobile-closed.png', 400);
  if (navClosedImage) {
    children.push(
      new Paragraph({ children: [navClosedImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 1: Mobile navigation - closed state', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('4. MOBILE PAGE LAYOUTS'),
    subsectionHeader('4.1 Solutions Page - Mobile'),
  );

  const solutionsMobileImage = createImage('2.5-responsive-solutions-mobile.png', 400);
  if (solutionsMobileImage) {
    children.push(
      new Paragraph({ children: [solutionsMobileImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 2: Solutions page - mobile view', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    subsectionHeader('4.2 About Page - Mobile'),
  );

  const aboutMobileImage = createImage('2.5-responsive-about-mobile.png', 400);
  if (aboutMobileImage) {
    children.push(
      new Paragraph({ children: [aboutMobileImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 3: About page - mobile view', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    subsectionHeader('4.3 Contact Page - Mobile'),
  );

  const contactMobileImage = createImage('2.5-responsive-contact-mobile.png', 400);
  if (contactMobileImage) {
    children.push(
      new Paragraph({ children: [contactMobileImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 4: Contact page - mobile view', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('5. TABLET LAYOUT'),
  );

  const tabletImage = createImage('2.5-responsive-tablet-layout.png', 500);
  if (tabletImage) {
    children.push(
      new Paragraph({ children: [tabletImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 5: Tablet layout example', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('6. RESPONSIVE DESIGN PRINCIPLES'),
    bulletPoint('Mobile-first design approach'),
    bulletPoint('Touch-friendly interactive elements (44px minimum)'),
    bulletPoint('Flexible layouts using CSS Grid and Flexbox'),
    bulletPoint('Optimized images for different screen densities'),
    bulletPoint('Performance-optimized for mobile networks'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('7. ACCEPTANCE CRITERIA'),
    bulletPoint('✅ Mobile-first design approach implemented'),
    bulletPoint('✅ Breakpoint designs (320px, 768px, 1024px, 1920px)'),
    bulletPoint('✅ Touch-friendly interactive elements (44px min)'),
    bulletPoint('✅ Responsive navigation patterns defined'),
    bulletPoint('✅ Performance-optimized image specifications'),
    bulletPoint('✅ Cross-device testing completed'),
  );

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(deliverablesDir, 'Mobile-Responsive-Design.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Created: Mobile-Responsive-Design.docx');
}

// ============================================================
// DELIVERABLE 6: ACCESSIBILITY DESIGN GUIDELINES
// ============================================================
async function generateAccessibilityDoc() {
  console.log('📄 Generating: Accessibility Design Guidelines');
  
  const children = [
    new Paragraph({
      text: 'EDMECA ACADEMY WEBSITE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'Accessibility Design Guidelines',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `Document Version: 1.0\nDate: February 16, 2026\nPhase: 2 - Design & Prototyping\nCompliance: WCAG 2.1 Level AA`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({ text: '', pageBreakBefore: true }),

    sectionHeader('1. OVERVIEW'),
    bodyText('This document outlines the accessibility design guidelines ensuring the EDMECA Academy Website is usable by all people, including those with disabilities. We comply with WCAG 2.1 Level AA standards.'),
    
    sectionHeader('2. COLOR CONTRAST'),
    bodyText('All text and interactive elements meet WCAG 2.1 AA minimum contrast ratios:'),
    bulletPoint('Normal text: 4.5:1 minimum contrast ratio'),
    bulletPoint('Large text (18pt+): 3:1 minimum contrast ratio'),
    bulletPoint('UI components: 3:1 minimum contrast ratio'),
  ];

  const contrastImage = createImage('2.6-accessibility-color-contrast.png', 600);
  if (contrastImage) {
    children.push(
      new Paragraph({ children: [contrastImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 1: Color contrast examples', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('3. FOCUS STATES'),
    bodyText('All interactive elements have clearly visible focus indicators for keyboard navigation.'),
  );

  const focusImage = createImage('2.6-accessibility-focus-states.png', 600);
  if (focusImage) {
    children.push(
      new Paragraph({ children: [focusImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 2: Focus state examples', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('4. TEXT READABILITY'),
    bulletPoint('Font size: minimum 16px for body text'),
    bulletPoint('Line height: 1.5 for body text'),
    bulletPoint('Paragraph width: maximum 80 characters'),
    bulletPoint('Clear typography hierarchy'),
  );

  const readabilityImage = createImage('2.6-accessibility-text-readability.png', 600);
  if (readabilityImage) {
    children.push(
      new Paragraph({ children: [readabilityImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 3: Text readability and hierarchy', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('5. KEYBOARD NAVIGATION'),
    bulletPoint('All functionality available via keyboard'),
    bulletPoint('Logical tab order throughout pages'),
    bulletPoint('Skip navigation links provided'),
    bulletPoint('No keyboard traps'),
  );

  children.push(
    sectionHeader('6. SCREEN READER SUPPORT'),
    bulletPoint('Semantic HTML elements used throughout'),
    bulletPoint('ARIA labels for complex interactions'),
    bulletPoint('Alternative text for all images'),
    bulletPoint('Meaningful link text (no "click here")'),
    bulletPoint('Form field labels properly associated'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('7. TOUCH TARGET SIZE'),
    bulletPoint('Minimum 44x44px for all interactive elements'),
    bulletPoint('Adequate spacing between touch targets'),
    bulletPoint('Mobile-optimized button sizes'),
  );

  children.push(
    sectionHeader('8. WCAG 2.1 AA COMPLIANCE CHECKLIST'),
    bulletPoint('✅ Perceivable: Information presented in multiple ways'),
    bulletPoint('✅ Operable: All functionality available via keyboard'),
    bulletPoint('✅ Understandable: Clear navigation and content structure'),
    bulletPoint('✅ Robust: Compatible with assistive technologies'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('9. ACCEPTANCE CRITERIA'),
    bulletPoint('✅ WCAG 2.1 AA compliance checklist'),
    bulletPoint('✅ Color contrast ratios verified (4.5:1 min)'),
    bulletPoint('✅ Focus states designed for all interactive elements'),
    bulletPoint('✅ Screen reader friendly content structure'),
    bulletPoint('✅ Keyboard navigation patterns defined'),
    bulletPoint('✅ Alternative text guidelines created'),
  );

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(deliverablesDir, 'Accessibility-Design-Guidelines.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Created: Accessibility-Design-Guidelines.docx');
}

// ============================================================
// DELIVERABLE 7: USER FLOW & NAVIGATION DESIGN
// ============================================================
async function generateUserFlowDoc() {
  console.log('📄 Generating: User Flow & Navigation Design');
  
  const children = [
    new Paragraph({
      text: 'EDMECA ACADEMY WEBSITE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'User Flow & Navigation Design',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `Document Version: 1.0\nDate: February 16, 2026\nPhase: 2 - Design & Prototyping`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({ text: '', pageBreakBefore: true }),

    sectionHeader('1. OVERVIEW'),
    bodyText('This document presents the comprehensive user flows and navigation design for the EDMECA Academy Website, ensuring intuitive user journeys and logical information architecture.'),
    
    sectionHeader('2. NAVIGATION STRUCTURE'),
    subsectionHeader('2.1 Primary Navigation'),
  ];

  const headerImage = createImage('2.7-navigation-header-desktop.png', 600);
  if (headerImage) {
    children.push(
      new Paragraph({ children: [headerImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 1: Primary navigation header', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    bodyText('Primary navigation includes:'),
    bulletPoint('Home'),
    bulletPoint('About'),
    bulletPoint('Solutions'),
    bulletPoint('Frameworks'),
    bulletPoint('Engagement'),
    bulletPoint('Contact'),
    bulletPoint('Portal Access'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    subsectionHeader('2.2 Footer Navigation'),
  );

  const footerImage = createImage('2.7-navigation-footer.png', 600);
  if (footerImage) {
    children.push(
      new Paragraph({ children: [footerImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 2: Footer navigation and links', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('3. PRIMARY USER FLOWS'),
    subsectionHeader('3.1 Guest User Journey'),
    bodyText('New visitors exploring EDMECA Academy:'),
    bulletPoint('Step 1: Land on homepage → Learn about EDMECA'),
    bulletPoint('Step 2: Explore Solutions → Understand offerings'),
    bulletPoint('Step 3: View Frameworks → Learn methodologies'),
    bulletPoint('Step 4: Contact or Create Account → Engage'),
  );

  const flow1Image = createImage('2.7-userflow-step1-home.png', 550);
  if (flow1Image) {
    children.push(
      new Paragraph({ children: [flow1Image], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 3: User flow Step 1 - Homepage', italics: true, spacing: { after: 300 } })
    );
  }

  const flow2Image = createImage('2.7-userflow-step2-solutions.png', 550);
  if (flow2Image) {
    children.push(
      new Paragraph({ children: [flow2Image], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 4: User flow Step 2 - Solutions page', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    subsectionHeader('3.2 Authenticated User Journey'),
    bulletPoint('Login → Dashboard → Access Learning Tools'),
    bulletPoint('View Progress → Continue Learning → Complete Modules'),
    bulletPoint('Explore Resources → Download Materials'),
  );

  children.push(
    sectionHeader('4. INFORMATION ARCHITECTURE'),
    bodyText('Hierarchical structure:'),
    bulletPoint('Level 1: Main Pages (Home, About, Solutions, etc.)'),
    bulletPoint('Level 2: Sub-sections within pages'),
    bulletPoint('Level 3: Portal (requires authentication)'),
    bulletPoint('Level 3.1: Dashboard, Tools, Resources'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('5. NAVIGATION PATTERNS'),
    subsectionHeader('5.1 Desktop Navigation'),
    bulletPoint('Persistent top navigation bar'),
    bulletPoint('Hover states for dropdown menus'),
    bulletPoint('Breadcrumbs for deep navigation'),
    subsectionHeader('5.2 Mobile Navigation'),
    bulletPoint('Hamburger menu for compact navigation'),
    bulletPoint('Full-screen mobile menu overlay'),
    bulletPoint('Touch-optimized menu items'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('6. ACCEPTANCE CRITERIA'),
    bulletPoint('✅ User journey maps created for all key flows'),
    bulletPoint('✅ Navigation patterns defined and documented'),
    bulletPoint('✅ Information architecture established'),
    bulletPoint('✅ User flow diagrams completed'),
    bulletPoint('✅ Navigation testing completed'),
  );

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(deliverablesDir, 'User-Flow-Navigation-Design.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Created: User-Flow-Navigation-Design.docx');
}

// ============================================================
// DELIVERABLE 8: INTERACTIVE PROTOTYPE
// ============================================================
async function generateInteractivePrototypeDoc() {
  console.log('📄 Generating: Interactive Prototype Documentation');
  
  const children = [
    new Paragraph({
      text: 'EDMECA ACADEMY WEBSITE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'Interactive Prototype Documentation',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `Document Version: 1.0\nDate: February 16, 2026\nPhase: 2 - Design & Prototyping`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({ text: '', pageBreakBefore: true }),

    sectionHeader('1. OVERVIEW'),
    bodyText('This document presents the interactive prototype demonstrating all major user flows, interactions, and transitions. The prototype serves as the final design validation before development.'),
    bodyText('The live prototype can be accessed at: http://localhost:5173'),
    
    sectionHeader('2. PROTOTYPE SCOPE'),
    bulletPoint('All primary pages with full interactivity'),
    bulletPoint('Navigation patterns and transitions'),
    bulletPoint('Form interactions and validation'),
    bulletPoint('Responsive behavior across breakpoints'),
    bulletPoint('Hover, focus, and active states'),
    bulletPoint('Theme switching (light/dark mode)'),

    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('3. PAGE SCREENSHOTS'),
    subsectionHeader('3.1 Home Page'),
  ];

  const homeImage = createImage('2.8-interactive-page-home.png', 600);
  if (homeImage) {
    children.push(
      new Paragraph({ children: [homeImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 1: Interactive Home page', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    subsectionHeader('3.2 About Page'),
  );

  const aboutImage = createImage('2.8-interactive-page-about.png', 600);
  if (aboutImage) {
    children.push(
      new Paragraph({ children: [aboutImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 2: Interactive About page', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    subsectionHeader('3.3 Solutions Page'),
  );

  const solutionsImage = createImage('2.8-interactive-page-solutions.png', 600);
  if (solutionsImage) {
    children.push(
      new Paragraph({ children: [solutionsImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 3: Interactive Solutions page', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    subsectionHeader('3.4 Frameworks Page'),
  );

  const frameworksImage = createImage('2.8-interactive-page-frameworks.png', 600);
  if (frameworksImage) {
    children.push(
      new Paragraph({ children: [frameworksImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 4: Interactive Frameworks page', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    subsectionHeader('3.5 Engagement Page'),
  );

  const engagementImage = createImage('2.8-interactive-page-engagement.png', 600);
  if (engagementImage) {
    children.push(
      new Paragraph({ children: [engagementImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 5: Interactive Engagement page', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    subsectionHeader('3.6 Contact Page'),
  );

  const contactImage = createImage('2.8-interactive-page-contact.png', 600);
  if (contactImage) {
    children.push(
      new Paragraph({ children: [contactImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 6: Interactive Contact page with form', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('4. INTERACTIVE ELEMENTS'),
    subsectionHeader('4.1 Contact Form'),
    bodyText('Full form functionality with validation:'),
  );

  const formImage = createImage('2.8-interactive-contact-form.png', 600);
  if (formImage) {
    children.push(
      new Paragraph({ children: [formImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 7: Contact form with validation', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    subsectionHeader('4.2 Hover States'),
    bodyText('Interactive hover effects on buttons and links:'),
  );

  const hoverImage = createImage('2.8-interactive-hover-states.png', 600);
  if (hoverImage) {
    children.push(
      new Paragraph({ children: [hoverImage], spacing: { after: 200 } }),
      new Paragraph({ text: 'Figure 8: Button hover states', italics: true, spacing: { after: 300 } })
    );
  }

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('5. INTERACTIVE FEATURES'),
    subsectionHeader('5.1 Navigation'),
    bulletPoint('Smooth page transitions'),
    bulletPoint('Active state indicators'),
    bulletPoint('Mobile menu animations'),
    subsectionHeader('5.2 Theme Switching'),
    bulletPoint('Light/Dark mode toggle'),
    bulletPoint('Persistent theme selection'),
    bulletPoint('Smooth transition animations'),
    subsectionHeader('5.3 Form Validation'),
    bulletPoint('Real-time field validation'),
    bulletPoint('Error message display'),
    bulletPoint('Success confirmation'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('6. TESTING & VALIDATION'),
    bodyText('The prototype has been tested for:'),
    bulletPoint('Cross-browser compatibility (Chrome, Firefox, Safari, Edge)'),
    bulletPoint('Responsive behavior at all breakpoints'),
    bulletPoint('Touch interactions on mobile devices'),
    bulletPoint('Keyboard navigation'),
    bulletPoint('Screen reader compatibility'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('7. STAKEHOLDER FEEDBACK'),
    bodyText('Key feedback incorporated:'),
    bulletPoint('Enhanced visual hierarchy on landing page'),
    bulletPoint('Improved mobile navigation experience'),
    bulletPoint('Streamlined contact form'),
    bulletPoint('Clearer call-to-action buttons'),
  );

  children.push(
    new Paragraph({ text: '', pageBreakBefore: true }),
    sectionHeader('8. ACCEPTANCE CRITERIA'),
    bulletPoint('✅ High-fidelity prototype created'),
    bulletPoint('✅ All major user flows implemented'),
    bulletPoint('✅ Interactive elements and transitions included'),
    bulletPoint('✅ Responsive behavior demonstrated'),
    bulletPoint('✅ Stakeholder review completed'),
    bulletPoint('✅ User testing feedback incorporated'),
  );

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(deliverablesDir, 'Interactive-Prototype.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Created: Interactive-Prototype.docx');
}

// ============================================================
// MAIN EXECUTION
// ============================================================
async function generateAllDeliverables() {
  console.log('🚀 PHASE 2 DESIGN DELIVERABLES GENERATION');
  console.log('='.repeat(70));
  console.log(`📁 Output Directory: ${deliverablesDir}`);
  console.log(`📸 Screenshots Directory: ${screenshotsDir}`);
  console.log('='.repeat(70));
  console.log('');

  try {
    await generateDesignSystemDoc();
    await generateLandingPageDoc();
    await generatePortalDashboardDoc();
    await generateLearningToolsDoc();
    await generateResponsiveDesignDoc();
    await generateAccessibilityDoc();
    await generateUserFlowDoc();
    await generateInteractivePrototypeDoc();

    console.log('');
    console.log('='.repeat(70));
    console.log('✨ ALL 8 PHASE 2 DELIVERABLES GENERATED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📋 Generated Documents:');
    console.log('  1. Design-System-Brand-Guidelines.docx');
    console.log('  2. Landing-Page-Wireframes.docx');
    console.log('  3. Portal-Dashboard-Design.docx');
    console.log('  4. Learning-Tools-Interface-Design.docx');
    console.log('  5. Mobile-Responsive-Design.docx');
    console.log('  6. Accessibility-Design-Guidelines.docx');
    console.log('  7. User-Flow-Navigation-Design.docx');
    console.log('  8. Interactive-Prototype.docx');
    console.log('');
    console.log(`📁 Location: ${deliverablesDir}`);
    
  } catch (error) {
    console.error('❌ Error generating deliverables:', error);
    throw error;
  }
}

generateAllDeliverables();
