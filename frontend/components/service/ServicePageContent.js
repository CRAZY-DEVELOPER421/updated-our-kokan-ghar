import Breadcrumb from '@/components/ui/Breadcrumb';

/**
 * Renders a customer service page's structured content.
 * Supports two shapes:
 *   - page_type 'text': { sections: [{ heading, body, list?: [] }] }
 *   - page_type 'faq':  { categories: [{ category, questions: [{ q, a }] }] }
 */
export default function ServicePageContent({ page, crumbLabel }) {
  const title = page?.title || crumbLabel || 'Customer Service';
  const content = page?.content || null;
  const isFaq = page?.page_type === 'faq' || content?.categories;

  return (
    <div className="animate-fade-in container-custom py-10 md:py-14">
      <Breadcrumb items={[{ label: crumbLabel || title }]} />
      <h1 className="font-display text-2xl md:text-4xl font-bold text-konkan-text-primary mb-2">{title}</h1>

      {isFaq && content?.categories ? (
        <FAQContent categories={content.categories} />
      ) : (
        <TextContent sections={content?.sections || []} />
      )}
    </div>
  );
}

function TextContent({ sections }) {
  if (!sections.length) {
    return (
      <p className="text-sm text-konkan-text-secondary mt-6">
        This page is being updated. Please check back soon.
      </p>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 text-konkan-text-secondary leading-relaxed mt-6">
      {sections.map((section, idx) => (
        <div key={idx} className="bg-white rounded-xl card p-6">
          {section.heading && (
            <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">
              {section.heading}
            </h2>
          )}
          {section.body && <p>{section.body}</p>}
          {section.list?.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 mt-1">
              {section.list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function FAQContent({ categories }) {
  return (
    <div className="space-y-8 max-w-3xl mt-8">
      {categories.map((section, si) => (
        <div key={si}>
          <h2 className="font-display text-lg font-bold text-konkan-green-primary mb-3">
            {section.category}
          </h2>
          <div className="space-y-2">
            {(section.questions || []).map((faq, idx) => (
              <details key={idx} className="bg-white rounded-xl card overflow-hidden group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-medium text-konkan-text-primary hover:bg-konkan-cream/50 transition-colors list-none flex items-center justify-between">
                  {faq.q}
                  <svg className="w-4 h-4 text-konkan-text-secondary shrink-0 ml-2 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm text-konkan-text-secondary leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
