// components/features/navigation/components/MobileMenu.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Corrected Lucide Imports
import {
    ChevronRight as ChevronRightIcon,
    ExternalLink as ExternalLinkIcon,
    MoreHorizontal as MoreHorizontalIcon,
    X as XIcon,
    ArrowLeft as ArrowLeftIcon,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
// Separator import removed as it's not used
import { cn } from '@/lib/utils';

// Interfaces for reference
// export interface MobileNavItemData { label: string; hasChildren?: boolean; icon?: 'right' | 'topRight' | 'more'; variant?: 'mobile' | 'mobileChild' | 'mobileSubItem'; url?: string; back?: boolean; }
// export interface MobileMenuProps { isOpen: boolean; onClose: () => void; navItems: MobileNavItemData[]; onItemClick: (item: MobileNavItemData) => void; activeSubmenu: string; }

// Use named export
export const MobileMenu = ({
    isOpen,
    onClose,
    navItems = [],
    onItemClick,
    activeSubmenu,
}) => {
    const scrollContainerRef = useRef(null);

    // Scroll to top when submenu changes
    useEffect(() => {
        requestAnimationFrame(() => {
            scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        });
    }, [activeSubmenu]);

    // --- Animation Variants ---
    const listContainerVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
        exit: { opacity: 0, transition: { staggerChildren: 0.03, staggerDirection: -1, when: "afterChildren" } },
    };

    const itemVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
        exit: { opacity: 0, x: -15, transition: { duration: 0.15, ease: "easeIn" } },
    };

    // Corrected renderIcon function
    const renderIcon = (item) => {
        const iconProps = {
            className: cn(
                "w-5 h-5 flex-shrink-0",
                item.variant === 'mobileSubItem' ? 'text-muted-foreground/70' : 'text-muted-foreground'
            ),
            strokeWidth: 1.5,
        };

        if (item.icon === "more") return <MoreHorizontalIcon {...iconProps} />;
        if (item.icon === "topRight") return <ExternalLinkIcon {...iconProps} />;
        if (item.hasChildren || item.icon === 'right') return <ChevronRightIcon {...iconProps} className={cn(iconProps.className, "w-4 h-4")} />;

        return <div className="w-5 h-5 flex-shrink-0"></div>;
    };

    const handleSheetOpenChange = (open) => {
        if (!open) {
            onClose();
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
            <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col bg-background">
                <SheetHeader className="p-4 pb-0 pt-5 border-b border-border relative">
                     <div className="h-[40px] mb-2 overflow-hidden relative">
                         <AnimatePresence mode="wait">
                             {activeSubmenu ? (
                                 <motion.div
                                     key={`title-${activeSubmenu}`}
                                     initial={{ opacity: 0, y: -10 }}
                                     animate={{ opacity: 1, y: 0, transition: { delay: 0.05, duration: 0.2 } }}
                                     exit={{ opacity: 0, y: -5, transition: { duration: 0.1 } }}
                                     className="absolute inset-0 flex items-end pb-1"
                                 >
                                     <SheetTitle className="text-xl font-semibold tracking-tight">
                                         {activeSubmenu}
                                     </SheetTitle>
                                 </motion.div>
                             ) : (
                                  <motion.div
                                     key="title-main"
                                     initial={{ opacity: 0, y: -10 }}
                                     animate={{ opacity: 1, y: 0, transition: { delay: 0.05, duration: 0.2 } }}
                                     exit={{ opacity: 0, y: -5, transition: { duration: 0.1 } }}
                                     className="absolute inset-0 flex items-end pb-1"
                                  >
                                       <SheetTitle className="text-xl font-semibold tracking-tight">
                                         Menu
                                     </SheetTitle>
                                  </motion.div>
                             )}
                         </AnimatePresence>
                     </div>
                     <SheetClose asChild>
                         <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 rounded-full" aria-label="Close menu">
                           <XIcon className="h-5 w-5" />
                         </Button>
                       </SheetClose>
                </SheetHeader>

                <div ref={scrollContainerRef} className="flex-grow overflow-y-auto overflow-x-hidden px-4 py-4 relative">
                     <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSubmenu || "main"}
                            variants={listContainerVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="w-full space-y-0"
                            role="menu"
                            aria-label={activeSubmenu || "Main menu"}
                        >
                            {navItems.map((item, index) => (
                                <motion.div
                                    key={item.label + index}
                                    variants={itemVariants}
                                    role="none"
                                    className="border-b border-border last:border-b-0"
                                >
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className={cn(
                                            "py-3 px-1.5 flex justify-between items-center cursor-pointer w-full text-left focus:outline-none focus-visible:bg-accent rounded-sm text-foreground",
                                            item.variant === 'mobileSubItem' && "pl-4"
                                        )}
                                        onClick={() => onItemClick(item)}
                                    >
                                        <span className={cn(
                                            "text-base font-medium tracking-tight leading-snug pr-2",
                                            item.variant === 'mobileSubItem' && "text-sm text-muted-foreground font-normal"
                                        )}>
                                            {item.label}
                                        </span>
                                        {(item.icon || item.hasChildren) && renderIcon(item)}
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                     </AnimatePresence>
                </div>

                 <SheetFooter className="p-4 border-t border-border bg-background">
                     <Button
                         variant="outline"
                         className="w-full justify-center"
                         onClick={activeSubmenu ? () => onItemClick({ back: true }) : onClose}
                         aria-label={activeSubmenu ? "Go back" : "Close menu"}
                     >
                         {activeSubmenu ? (
                            // CORRECTED JSX Comment Placement
                            <ArrowLeftIcon className="w-4 h-4 mr-2" /> /* Use ArrowLeftIcon for Back */
                         ) : (
                            // CORRECTED JSX Comment Placement
                            <XIcon className="w-4 h-4 mr-2" /> /* Use XIcon for Close */
                         )}
                         <span className="text-sm font-medium">{activeSubmenu ? "Back" : "Close"}</span>
                     </Button>
                 </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

// ADD default export
export default MobileMenu;