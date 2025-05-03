This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


```
km-booking
├─ app
│  ├─ book
│  │  └─ page.jsx
│  ├─ dealers
│  │  ├─ DealerLocatorClient.jsx
│  │  └─ page.jsx
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.js
│  └─ page.js
├─ bun.lock
├─ components
│  ├─ features
│  │  ├─ booking
│  │  │  ├─ BookingContainer.jsx
│  │  │  ├─ ColorSelector.jsx
│  │  │  ├─ ComponentCard.jsx
│  │  │  ├─ LocationSearch.jsx
│  │  │  ├─ OTPInputGroup.jsx
│  │  │  ├─ PhoneInput.jsx
│  │  │  ├─ SectionTitle.jsx
│  │  │  ├─ steps
│  │  │  │  ├─ FailureState.jsx
│  │  │  │  ├─ OTPVerification.jsx
│  │  │  │  ├─ PaymentOverlay.jsx
│  │  │  │  ├─ SuccessState.jsx
│  │  │  │  ├─ UserInformation.jsx
│  │  │  │  └─ VehicleConfiguration.jsx
│  │  │  ├─ VariantCard.jsx
│  │  │  ├─ VehicleCard.jsx
│  │  │  └─ VehicleSummary.jsx
│  │  ├─ dealers
│  │  │  ├─ DealerCard.jsx
│  │  │  ├─ DealerDetailSheet.jsx
│  │  │  ├─ DealerList.jsx
│  │  │  ├─ DealerMap.jsx
│  │  │  ├─ DealerSearch.jsx
│  │  │  ├─ MapPlaceholder.jsx
│  │  │  └─ Pagination.jsx
│  │  └─ navigation
│  │     ├─ components
│  │     ├─ DesktopDropdown.jsx
│  │     ├─ NavBar.jsx
│  │     ├─ NavigationContainer.jsx
│  │     └─ NavItem.jsx
│  └─ ui
│     ├─ alert.jsx
│     ├─ badge.jsx
│     ├─ button.jsx
│     ├─ card.jsx
│     ├─ checkbox.jsx
│     ├─ command.jsx
│     ├─ dialog.jsx
│     ├─ input-otp.jsx
│     ├─ input.jsx
│     ├─ label.jsx
│     ├─ navigation-menu.jsx
│     ├─ popover.jsx
│     ├─ radio-group.jsx
│     ├─ select.jsx
│     ├─ separator.jsx
│     ├─ sheet.jsx
│     ├─ skeleton.jsx
│     └─ sonner.jsx
├─ components.json
├─ context
│  └─ BookingContext.jsx
├─ hooks
│  ├─ useApiData.js
│  ├─ useDebounce.js
│  ├─ useFormValidation.js
│  ├─ useGeolocation.js
│  ├─ useLocationSearch.js
│  └─ useStepNavigation.js
├─ jsconfig.json
├─ lib
│  ├─ api.js
│  ├─ constants.js
│  ├─ dealer-data.js
│  ├─ formatting.js
│  ├─ geo.js
│  ├─ sanityClient.js
│  ├─ theme.js
│  ├─ utils.js
│  ├─ validation.js
│  └─ vehicle-data.js
├─ next.config.mjs
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
└─ README.md

```