# Brand Design System Usage Guidelines

## Overview
This document provides comprehensive guidelines for using the B2B Marketplace brand design system, implemented as part of the brand consistency update.

## Color Palette

### Primary Colors
- **Primary Orange**: `#FF9900` (HSL: 39 100% 50%)
  - Use for: Primary buttons, links, highlights, brand elements
  - Tailwind classes: `bg-primary`, `text-primary`, `border-primary`

- **Dark Grey**: `#1A1A1A` (HSL: 0 0% 10%)
  - Use for: Primary text, dark UI elements, secondary buttons
  - Tailwind classes: `bg-secondary`, `text-secondary`, `border-secondary`

### Secondary Colors
- **Light Orange Tints**: For backgrounds and subtle highlights
  - `bg-primary/10` - Very light orange background
  - `bg-primary/20` - Light orange background
  - `bg-primary/80` - Darker orange for hover states

- **Grey Variations**: For text hierarchy and UI elements
  - `text-gray-600` - Secondary text
  - `text-gray-400` - Tertiary text
  - `bg-gray-50` - Light backgrounds

## Typography

### Font Family
- **Primary Font**: Base Neue
- **Fallback Stack**: Inter, system-ui, -apple-system, sans-serif
- **CSS Variable**: `var(--font-sans)`

### Font Weights
- **Normal**: 400 (body text)
- **Medium**: 500 (subheadings)
- **Semibold**: 600 (headings)
- **Bold**: 700 (emphasis)

### Usage Examples
```tsx
// Headings
<h1 className="text-3xl font-bold text-secondary">Main Heading</h1>
<h2 className="text-xl font-semibold text-secondary">Subheading</h2>

// Body text
<p className="text-base text-gray-600">Body text content</p>

// Links
<a href="#" className="text-primary hover:text-primary/80">Link text</a>
```

## Component Guidelines

### Buttons
```tsx
// Primary button
<Button className="bg-primary hover:bg-primary/90 text-white">
  Primary Action
</Button>

// Secondary button
<Button variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-white">
  Secondary Action
</Button>

// Ghost button
<Button variant="ghost" className="text-primary hover:bg-primary/10">
  Ghost Action
</Button>
```

### Form Elements
```tsx
// Input fields
<Input className="border-gray-300 focus:border-primary focus:ring-primary/20" />

// Labels
<Label className="text-secondary font-medium">Field Label</Label>

// Error states
<Input className="border-red-500 focus:border-red-500 focus:ring-red-500/20" />
<p className="text-red-600 text-sm">Error message</p>
```

### Cards and Containers
```tsx
// Standard card
<Card className="border-gray-200 hover:shadow-lg transition-shadow">
  <CardHeader className="border-b border-gray-100">
    <CardTitle className="text-secondary">Card Title</CardTitle>
  </CardHeader>
  <CardContent className="text-gray-600">
    Card content
  </CardContent>
</Card>
```

### Navigation
```tsx
// Active navigation item
<NavItem className="bg-primary text-white">Active Item</NavItem>

// Inactive navigation item
<NavItem className="text-gray-600 hover:text-primary hover:bg-primary/10">
  Inactive Item
</NavItem>
```

## Accessibility Guidelines

### Contrast Requirements
- Ensure minimum 4.5:1 contrast ratio for normal text
- Ensure minimum 3:1 contrast ratio for large text (18pt+)
- Test all color combinations with accessibility tools

### Focus States
- All interactive elements must have visible focus indicators
- Use orange color with sufficient contrast for focus rings
- Maintain focus visibility in high contrast mode

### Color Usage
- Never rely solely on color to convey information
- Provide alternative indicators (icons, text, patterns)
- Support high contrast and forced colors modes

## Implementation Checklist

### New Components
- [ ] Use CSS custom properties for colors
- [ ] Include proper font family declarations
- [ ] Implement focus states with brand colors
- [ ] Test contrast ratios
- [ ] Verify responsive behavior
- [ ] Test in high contrast mode

### Existing Components
- [ ] Replace blue colors with orange equivalents
- [ ] Update font families to Base Neue
- [ ] Verify accessibility compliance
- [ ] Test across different screen sizes
- [ ] Validate in multiple browsers

## Common Patterns

### Status Indicators
```tsx
// Success
<Badge className="bg-green-100 text-green-800">Success</Badge>

// Warning
<Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>

// Error
<Badge className="bg-red-100 text-red-800">Error</Badge>

// Info (use orange instead of blue)
<Badge className="bg-primary/10 text-primary">Info</Badge>
```

### Loading States
```tsx
// Spinner with brand colors
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>

// Skeleton with brand colors
<div className="animate-pulse bg-gray-200 rounded h-4 w-full"></div>
```

## Performance Considerations

### Font Loading
- Use `font-display: swap` for web fonts
- Preload critical font weights (400, 600)
- Provide proper fallback fonts
- Monitor Core Web Vitals impact

### CSS Optimization
- Use CSS custom properties for theme values
- Minimize CSS bundle size
- Leverage Tailwind's purging for unused styles
- Optimize critical CSS delivery

## Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Fallbacks
- CSS custom properties fallbacks for older browsers
- System font fallbacks for font loading failures
- Graceful degradation for unsupported features

## Testing Guidelines

### Visual Testing
- Test all components with new colors
- Verify font rendering across browsers
- Check responsive behavior
- Validate print styles

### Accessibility Testing
- Use automated accessibility scanners
- Test with screen readers
- Verify keyboard navigation
- Check high contrast mode compatibility

### Performance Testing
- Monitor font loading performance
- Test CSS rendering performance
- Validate Core Web Vitals metrics
- Check mobile performance

## Maintenance

### Regular Audits
- Monthly accessibility audits
- Quarterly performance reviews
- Annual brand consistency checks
- Continuous monitoring of user feedback

### Updates and Changes
- Document all brand system changes
- Communicate updates to development team
- Maintain backward compatibility when possible
- Test thoroughly before deployment

## Resources

### Design Tokens
- CSS custom properties: `client/src/index.css`
- Tailwind configuration: `tailwind.config.ts`
- Component library: `client/src/components/ui/`

### Testing Tools
- Accessibility: `client/src/utils/accessibility.ts`
- Contrast testing: `client/src/utils/contrastTesting.ts`
- Performance monitoring: `client/src/utils/webVitalsMonitor.ts`

### Documentation
- Component examples: `client/src/examples/`
- Test suites: `tests/brand-design-system/`
- Performance reports: Generated by monitoring tools

---

For questions or clarifications about the brand design system, refer to the implementation files or contact the development team.
