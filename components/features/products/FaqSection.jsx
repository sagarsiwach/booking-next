// components/features/products/FaqSection.jsx
"use client";

import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FaqSection({ block }) {
  const {
    titleOverride,
    referencedFaqs = [],
    // Add any layout/behavior controls from Sanity if needed
    // allowMultipleOpen = false,
    // initialOpenIndex = -1
  } = block || {};

  // Use internal state for accordion if controls aren't from Sanity
  // const [activeItemValue, setActiveItemValue] = useState(
  //     allowMultipleOpen ? [] : (initialOpenIndex >= 0 && referencedFaqs[initialOpenIndex] ? referencedFaqs[initialOpenIndex]._id : undefined)
  // );
  // For simplicity, let Shadcn handle its default single/multiple behavior based on `type`

  const sectionTitle = titleOverride || "Frequently Asked Questions"; // Use override or default

  if (!referencedFaqs || referencedFaqs.length === 0) {
    return null; // Don't render if no FAQs
  }

  // Determine accordion type based on a prop (if added) or default to single
  const accordionType = "single"; // Default to single collapsible
  // const accordionType = allowMultipleOpen ? "multiple" : "single";

  return (
    <section className="py-16 md:py-24 bg-background text-foreground border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center md:text-left mb-12 max-w-2xl mx-auto md:mx-0">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2">
            {sectionTitle}
          </h2>
          {/* Add subtitle from block if needed */}
          {/* {block.subtitle && <p className="text-lg md:text-xl text-muted-foreground">{block.subtitle}</p>} */}
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion
            type={accordionType}
            collapsible={accordionType === "single"} // Only collapsible if single
            // value={activeItemValue} // Control state if needed
            // onValueChange={setActiveItemValue} // Control state if needed
            className="w-full"
          >
            {referencedFaqs.map((item) => (
              <AccordionItem key={item._id} value={item._id}>
                <AccordionTrigger className="text-left hover:no-underline text-lg py-4">
                  {item.question || "Question missing"}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pb-4">
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {item.answer || "Answer missing"}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

// --- PropTypes ---
const FaqItemPropTypes = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  question: PropTypes.string,
  answer: PropTypes.string, // Expecting plain text from pt::text()
});

FaqSection.propTypes = {
  block: PropTypes.shape({
    titleOverride: PropTypes.string,
    referencedFaqs: PropTypes.arrayOf(FaqItemPropTypes),
    // Add controls if implemented in Sanity
    // allowMultipleOpen: PropTypes.bool,
    // initialOpenIndex: PropTypes.number,
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
  }).isRequired,
};
