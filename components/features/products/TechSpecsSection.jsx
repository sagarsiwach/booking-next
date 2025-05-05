// components/features/products/TechSpecsSection.jsx
"use client";

import React from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

// --- Helper component for rendering individual spec items ---
const SpecItem = ({ item }) => {
  if (!item) return null;

  // --- Key/Value Item ---
  if (item._type === "specKeyValue") {
    return (
      <div className="py-3">
        {item.key && (
          <dt className="text-sm font-medium text-muted-foreground mb-0.5">
            {item.key}
          </dt>
        )}
        <dd className="text-base text-foreground">
          {item.value || "-"}
          {item.unit && (
            <span className="ml-1 text-sm text-muted-foreground">
              {item.unit}
            </span>
          )}
        </dd>
      </div>
    );
  }

  // --- Color Swatch Item ---
  if (item._type === "specColorSwatchDisplay") {
    return (
      <div className="flex items-center py-3" title={item.altText || item.name}>
        <span
          className="w-6 h-6 rounded-full border border-border mr-3 flex-shrink-0"
          style={{ backgroundColor: item.color || "#ccc" }}
          aria-label={item.altText || `Color swatch for ${item.name}`}
        ></span>
        <span className="text-base text-foreground">
          {item.name || "Unnamed Color"}
          {item.suffix && (
            <span className="text-sm text-muted-foreground ml-1">
              {item.suffix}
            </span>
          )}
        </span>
      </div>
    );
  }

  // --- Simple List Item ---
  if (item._type === "specSimpleListItem") {
    // Render as list item if inside <ul>, otherwise as <p> or <div>
    // This requires the parent to render the correct container (ul or div)
    return (
      <span className="block py-1 text-base text-foreground">
        {item.itemName || "-"}
      </span>
    );
  }

  // --- Fallback for unknown item types ---
  console.warn(`Unknown spec item type: ${item._type}`);
  return (
    <div className="py-3 text-sm text-destructive">
      Unknown Spec Type: {item._type || "undefined"}
    </div>
  );
};
SpecItem.propTypes = {
  item: PropTypes.object.isRequired, // Basic shape check
};

// --- Main Section Component ---
export default function TechSpecsSection({ block }) {
  // Removed productContext
  const {
    sectionTitle = "Technical Specifications",
    sectionSubtitle,
    specGroups = [],
  } = block || {};

  if (!specGroups || specGroups.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-card text-card-foreground border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center md:text-left mb-12 max-w-2xl mx-auto md:mx-0">
            {sectionTitle && (
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2">
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p className="text-lg md:text-xl text-muted-foreground">
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {specGroups.map((group) => (
            <div key={group._key} className="mb-12 last:mb-0">
              {group.title && (
                <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-6 pb-3 border-b border-border">
                  {group.title}
                </h3>
              )}

              {group.items &&
                group.items.length > 0 &&
                (() => {
                  const firstItemType = group.items[0]._type;
                  const renderItems = () =>
                    group.items.map((item) => (
                      <SpecItem key={item._key} item={item} />
                    ));

                  if (
                    firstItemType === "specKeyValue" &&
                    group.items.length > 1
                  ) {
                    return (
                      <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
                        {renderItems()}
                      </dl>
                    );
                  } else if (firstItemType === "specColorSwatchDisplay") {
                    return (
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {renderItems()}
                      </div>
                    );
                  } else if (firstItemType === "specSimpleListItem") {
                    // Wrap simple list items in a <ul>
                    return (
                      <ul className="list-disc list-inside space-y-1 pl-5">
                        {group.items.map((item) => (
                          <li key={item._key}>
                            {" "}
                            {/* Use li for semantic list */}
                            <SpecItem item={item} />
                          </li>
                        ))}
                      </ul>
                    );
                  } else {
                    // Default: Stack single items or fallback
                    return <div>{renderItems()}</div>;
                  }
                })()}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- PropTypes ---
const SpecItemPropTypes = PropTypes.shape({
  _key: PropTypes.string.isRequired,
  _type: PropTypes.string.isRequired,
  // Add specific fields based on item types if needed, e.g.:
  key: PropTypes.string,
  value: PropTypes.string,
  unit: PropTypes.string,
  name: PropTypes.string,
  color: PropTypes.string,
  altText: PropTypes.string,
  suffix: PropTypes.string,
  itemName: PropTypes.string,
});

const SpecGroupPropTypes = PropTypes.shape({
  _key: PropTypes.string.isRequired,
  title: PropTypes.string,
  items: PropTypes.arrayOf(SpecItemPropTypes),
});

TechSpecsSection.propTypes = {
  block: PropTypes.shape({
    sectionTitle: PropTypes.string,
    sectionSubtitle: PropTypes.string,
    specGroups: PropTypes.arrayOf(SpecGroupPropTypes),
    _key: PropTypes.string.isRequired,
    _type: PropTypes.string.isRequired,
  }).isRequired,
};
