# Design Rules

## Focus States
- **No Blue Focus Rings**: Interactive elements (buttons, inputs, etc.) must NOT have the default blue focus ring or the `focus-visible:ring-2 focus-visible:ring-ring` Tailwind classes.
- **Subtle Focus**: Instead of rings, use subtle border color changes or shadows that match the brand's aesthetic without being distracting.
- **Accessibility**: Ensure focused states are still perceivable (e.g., via slight color shifts or border changes) but avoid "jumping" offsets and bright blue rings.
