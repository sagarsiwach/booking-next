// components/features/dealers/DealerDetailSheet.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatAddress,
  formatPhone,
  formatUrl,
  getDirectionsUrl,
  decodeHtmlEntities,
} from "@/lib/formatting";
import {
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  GlobeIcon,
  ClockIcon,
  SettingsIcon,
  StoreIcon,
  BoltIcon,
  ArrowLeftIcon,
  NavigationIcon,
  ExternalLinkIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Motion Variants ---
const sheetContentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.15, staggerChildren: 0.06 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

// --- Helper Components (Corrected) ---
const DetailSection = ({ title, children, className, ...rest }) => (
  <motion.section
    variants={itemVariants}
    className={cn("mb-4", className)}
    {...rest}
  >
    {title && (
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </h3>
    )}
    {children}
  </motion.section>
);

const ContactItem = ({ icon: Icon, href, children, className }) => {
  // Return the JSX directly, removed the dangling attributes outside the tag
  return (
    <a // The `<a>` tag should be returned directly
      href={href || "#"}
      target={
        href && !href.startsWith("tel:") && !href.startsWith("mailto:")
          ? "_blank"
          : undefined
      }
      rel={
        href && !href.startsWith("tel:") && !href.startsWith("mailto:")
          ? "noopener noreferrer"
          : undefined
      }
      className={cn(
        "flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors break-words group",
        !href && "text-muted-foreground opacity-60 pointer-events-none",
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 group-hover:text-primary/80 transition-colors" />
      <span className="leading-snug">{children}</span>
      {href && !href.startsWith("tel:") && !href.startsWith("mailto:") && (
        <ExternalLinkIcon className="w-3 h-3 text-muted-foreground/60 ml-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </a>
  );
};

const ServiceItem = ({
  icon: Icon,
  label,
  available,
  color = "text-foreground",
}) => {
  // Return the JSX directly
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        available ? "text-foreground" : "text-muted-foreground/50"
      )}
    >
      <Icon
        className={cn(
          "w-3.5 h-3.5 flex-shrink-0",
          available ? color : "text-muted-foreground/50"
        )}
      />
      <span className="leading-snug">{label}</span>
    </div>
  );
};
// --- End Helper Components ---

/** @typedef {import('@/lib/constants').Dealer} Dealer */

const DealerDetailSheet = ({
  dealer,
  isOpen,
  onClose,
  distanceUnit = "km",
  isMobile = false,
}) => {
  if (!dealer) return null;

  const {
    id,
    name = "Unnamed Dealer",
    address,
    contact,
    hours,
    services,
    distance,
    imageUrl,
  } = dealer;
  const safeServices = Array.isArray(services) ? services : [];
  const hasSales = safeServices.some(
    (s) => s && (s.toLowerCase() === "sales" || s.toLowerCase() === "store")
  );
  const hasService = safeServices.some(
    (s) => s && (s.toLowerCase() === "service" || s.toLowerCase() === "repair")
  );
  const hasCharging = safeServices.some(
    (s) => s && s.toLowerCase() === "charging"
  );
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const directionsUrl = getDirectionsUrl(dealer);
  const callUrl = contact?.phone
    ? `tel:${formatPhone(contact.phone)}`
    : undefined;
  const emailUrl = contact?.email ? `mailto:${contact.email}` : undefined;
  const websiteUrl = contact?.website ? formatUrl(contact.website) : undefined;
  const sheetTitleId = `dealer-sheet-title-${id}`;
  const sheetDescId = `dealer-sheet-desc-${id}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "w-full flex flex-col p-0",
          isMobile ? "h-[90dvh]" : "sm:max-w-md md:max-w-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          isMobile
            ? "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
            : "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          "duration-300 ease-in-out"
        )}
        aria-labelledby={sheetTitleId}
        aria-describedby={sheetDescId}
      >
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b sticky top-0 bg-background z-10">
          <div className="flex justify-between items-center gap-3">
            <SheetTitle
              id={sheetTitleId}
              className="text-lg font-semibold truncate mr-2"
            >
              {decodeHtmlEntities(name)}
            </SheetTitle>
            <SheetDescription id={sheetDescId} className="sr-only">
              Details for {decodeHtmlEntities(name)} dealer location.
            </SheetDescription>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2 h-8 w-8 rounded-full"
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
          {distance !== undefined && distance !== Infinity && (
            <p className="text-xs text-muted-foreground pt-0">
              Approx. {distance.toFixed(1)} {distanceUnit} away
            </p>
          )}
        </SheetHeader>

        {/* Scrollable Content Area */}
        <motion.div
          className="flex-1 overflow-y-auto px-4 pb-4 pt-3"
          variants={sheetContentVariants}
          initial="hidden"
          animate={isOpen ? "visible" : "hidden"}
        >
          {/* Content Sections */}
          {imageUrl && !isMobile && (
            <motion.div
              variants={itemVariants}
              className="mb-3 aspect-[16/10] w-full overflow-hidden rounded-md bg-muted shadow-sm"
            >
              <img
                src={imageUrl}
                alt={`${name} location`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          )}
          {address && (
            <DetailSection title="Address">
              <p className="text-sm leading-normal">{formatAddress(address)}</p>
            </DetailSection>
          )}
          {(callUrl || emailUrl || websiteUrl) && (
            <DetailSection title="Contact">
              <div className="space-y-2">
                {callUrl && (
                  <ContactItem icon={PhoneIcon} href={callUrl}>
                    {contact?.phone}
                  </ContactItem>
                )}
                {emailUrl && (
                  <ContactItem icon={MailIcon} href={emailUrl}>
                    {contact?.email}
                  </ContactItem>
                )}
                {websiteUrl && (
                  <ContactItem icon={GlobeIcon} href={websiteUrl}>
                    {contact?.website?.replace(/^https?:\/\//, "")}
                  </ContactItem>
                )}
              </div>
            </DetailSection>
          )}
          {hours && hours.length > 0 && (
            <DetailSection title="Opening Hours">
              <div className="space-y-1 text-sm">
                {hours.map((hour) => (
                  <div
                    key={hour?._key || hour?.day}
                    className="flex justify-between"
                  >
                    <span
                      className={cn(
                        "text-muted-foreground",
                        hour?.day === today && "font-medium text-primary"
                      )}
                    >
                      {hour?.day}
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        hour?.day === today && "text-primary",
                        hour?.open === "Closed"
                          ? "text-muted-foreground/80"
                          : "text-foreground"
                      )}
                    >
                      {hour?.open === "Closed"
                        ? "Closed"
                        : `${hour?.open} - ${hour?.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}
          {safeServices.length > 0 && (
            <DetailSection title="Services Available">
              <div className="space-y-1.5">
                <ServiceItem
                  icon={StoreIcon}
                  label="Sales / Store"
                  available={hasSales}
                  color="text-blue-600"
                />
                <ServiceItem
                  icon={SettingsIcon}
                  label="Service / Repair"
                  available={hasService}
                  color="text-red-600"
                />
                <ServiceItem
                  icon={BoltIcon}
                  label="EV Charging"
                  available={hasCharging}
                  color="text-green-600"
                />
              </div>
            </DetailSection>
          )}
        </motion.div>

        {/* Footer Actions */}
        <SheetFooter className="p-3 border-t bg-background sticky bottom-0 z-10">
          {isMobile ? (
            <div className="grid grid-cols-2 gap-2">
              <SheetClose asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
                </Button>
              </SheetClose>
              {callUrl ? (
                <Button size="sm" asChild className="w-full">
                  <a href={callUrl}>
                    <PhoneIcon className="w-4 h-4 mr-1.5" /> Call
                  </a>
                </Button>
              ) : (
                // Corrected Anchor Tag within Button
                <Button size="sm" asChild className="w-full">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <NavigationIcon className="w-4 h-4 mr-1.5" /> Directions
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex w-full flex-col sm:flex-row justify-end gap-2">
              <SheetClose asChild>
                <Button size="sm" variant="outline">
                  Close
                </Button>
              </SheetClose>
              {callUrl && (
                <Button size="sm" asChild variant="outline">
                  <a href={callUrl}>
                    <PhoneIcon className="w-4 h-4 mr-1.5" /> Call
                  </a>
                </Button>
              )}
              {/* Corrected Anchor Tag within Button */}
              <Button size="sm" asChild>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <NavigationIcon className="w-4 h-4 mr-1.5" /> Directions
                </a>
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default DealerDetailSheet;
