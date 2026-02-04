# Design System

This document serves as the single source of truth for the project's design system, including color palettes and typography.

## Color Palette

Derived from `app/globals.css`.

### Light Mode

| Token | Variable | HSL Value | Hex (Approx) | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | `--background` | `0 0% 100%` | `#FFFFFF` | Page background |
| **Foreground** | `--foreground` | `0 0% 3.9%` | `#0A0A0A` | Default text color |
| **Card** | `--card` | `0 0% 100%` | `#FFFFFF` | Card background |
| **Card FG** | `--card-foreground` | `0 0% 3.9%` | `#0A0A0A` | Card text color |
| **Primary** | `--primary` | `0 0% 9%` | `#171717` | High-emphasis actions/bg |
| **Primary FG** | `--primary-foreground` | `0 0% 98%` | `#FAFAFA` | Text on primary bg |
| **Secondary** | `--secondary` | `0 0% 96.1%` | `#F5F5F5` | Secondary backgrounds |
| **Secondary FG**| `--secondary-foreground`| `0 0% 9%` | `#171717` | Text on secondary bg |
| **Accent** | `--accent` | `0 0% 96.1%` | `#F5F5F5` | Interactive elements (hover) |
| **Accent FG** | `--accent-foreground` | `0 0% 9%` | `#171717` | Text on accent bg |
| **Border** | `--border` | `0 0% 89.8%` | `#E5E5E5` | Borders and dividers |

### Dark Mode

| Token | Variable | HSL Value | Hex (Approx) | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | `--background` | `0 0% 3.9%` | `#0A0A0A` | Page background |
| **Foreground** | `--foreground` | `0 0% 98%` | `#FAFAFA` | Default text color |
| **Card** | `--card` | `0 0% 3.9%` | `#0A0A0A` | Card background |
| **Card FG** | `--card-foreground` | `0 0% 98%` | `#FAFAFA` | Card text color |
| **Primary** | `--primary` | `0 0% 98%` | `#FAFAFA` | High-emphasis actions/bg |
| **Primary FG** | `--primary-foreground` | `0 0% 9%` | `#171717` | Text on primary bg |
| **Secondary** | `--secondary` | `0 0% 14.9%` | `#262626` | Secondary backgrounds |
| **Secondary FG**| `--secondary-foreground`| `0 0% 98%` | `#FAFAFA` | Text on secondary bg |
| **Accent** | `--accent` | `0 0% 14.9%` | `#262626` | Interactive elements (hover) |
| **Accent FG** | `--accent-foreground` | `0 0% 98%` | `#FAFAFA` | Text on accent bg |
| **Border** | `--border` | `0 0% 14.9%` | `#262626` | Borders and dividers |

### Brand Colors

| Token | Variable | HSL Value | Hex (Approx) | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Cyan** | `--accent-primary` | `188 92% 70%` | `#6CDCF7` | Brand identity, highlights |

---

## Shadows

Adapt depth to the theme to avoid harsh contrast.

| Mode | Utility Class | Description |
| :--- | :--- | :--- |
| **Light Mode** | `shadow-xl` | Softer shadow to prevent harsh black outlines on white. |
| **Dark Mode** | `dark:shadow-2xl` | Stronger shadow to maintain depth on dark surfaces. |

**Rule:** Always use `shadow-xl dark:shadow-2xl` for large cards/modals instead of a single `shadow-2xl`.