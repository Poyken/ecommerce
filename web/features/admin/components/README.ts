/**
 * =====================================================================
 * ADMIN COMPONENTS - STANDARDIZED STRUCTURE
 * =====================================================================
 *
 * 📚 COMPONENT CONVENTIONS
 *
 * All admin components follow these patterns for consistency:
 *
 * 1. FILE NAMING
 *    - kebab-case for file names: `create-product-dialog.tsx`
 *    - PascalCase for component names: `CreateProductDialog`
 *
 * 2. COMPONENT STRUCTURE
 *    ```tsx
 *    interface Props {
 *      // Props interface first
 *    }
 *
 *    export function ComponentName({ ...props }: Props) {
 *      // Hooks at the top
 *      const t = useTranslations();
 *      const [state, setState] = useState();
 *
 *      // Derived values / memoization
 *      const computed = useMemo(() => ..., [deps]);
 *
 *      // Event handlers
 *      const handleSubmit = () => { ... };
 *
 *      // Render
 *      return ( ... );
 *    }
 *    ```
 *
 * 3. DIALOG COMPONENTS
 *    All dialogs use FormDialog wrapper for consistency:
 *    - Unified header/footer styling
 *    - Built-in loading states
 *    - Consistent close behavior
 *
 * 4. FORM VALIDATION
 *    - Inline validation with animated error messages
 *    - Use AnimatedError component for consistent UX
 *    - Validate on submit, clear on change
 *
 * 5. STATE MANAGEMENT
 *    - Local state for form data
 *    - useTransition for async operations
 *    - isDirty check for edit forms
 *
 * 6. TRANSLATIONS
 *    - All text via useTranslations()
 *    - Keys: `admin.{domain}.{key}`
 *    - Example: `admin.products.createNew`
 *
 * 📁 FOLDER STRUCTURE
 *
 * components/
 * ├── coupons/
 * │   ├── coupon-form-fields.tsx     # Shared form fields
 * │   ├── create-coupon-dialog.tsx   # Create dialog
 * │   └── edit-coupon-dialog.tsx     # Edit dialog
 * ├── products/
 * │   ├── product-basic-info.tsx     # Form section
 * │   ├── product-metadata.tsx       # Form section
 * │   ├── product-seo-info.tsx       # Form section
 * │   ├── product-options-manager.tsx # Complex sub-form
 * │   ├── create-product-dialog.tsx  # Create dialog
 * │   └── edit-product-dialog.tsx    # Edit dialog
 * ├── taxonomy/
 * │   ├── create-brand-dialog.tsx
 * │   ├── edit-brand-dialog.tsx
 * │   ├── create-category-dialog.tsx
 * │   └── edit-category-dialog.tsx
 * ├── users/
 * │   ├── add-address-dialog.tsx
 * │   ├── create-user-dialog.tsx
 * │   └── edit-user-dialog.tsx
 * ├── shared/
 * │   └── delete-confirm-dialog.tsx  # Reusable confirm
 * └── ui/
 *     └── ...                         # Admin-specific UI
 *
 * =====================================================================
 */

export {};
