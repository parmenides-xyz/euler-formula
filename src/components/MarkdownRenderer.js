import React from 'react';

const MarkdownRenderer = ({ content, className = '' }) => {
  const renderMarkdown = (text) => {
    if (!text) return '';

    // Convert markdown-style formatting to JSX
    let formatted = text;

    // Handle headings
    formatted = formatted.replace(/^######\s+(.*)$/gm, '<h6 class="text-base font-semibold">$1</h6>');
    formatted = formatted.replace(/^#####\s+(.*)$/gm, '<h5 class="text-lg font-semibold">$1</h5>');
    formatted = formatted.replace(/^####\s+(.*)$/gm, '<h4 class="text-xl font-semibold">$1</h4>');
    formatted = formatted.replace(/^###\s+(.*)$/gm, '<h3 class="text-2xl font-semibold">$1</h3>');
    formatted = formatted.replace(/^##\s+(.*)$/gm, '<h2 class="text-3xl font-semibold">$1</h2>');
    formatted = formatted.replace(/^#\s+(.*)$/gm, '<h1 class="text-4xl font-bold">$1</h1>');

    // Handle bold text (**text**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    
    // Handle bullet points (• or -)
    formatted = formatted.replace(/^([•\-])\s(.+)$/gm, '<div class="flex items-start space-x-2 my-1"><span class="text-blue-400 text-sm mt-1">•</span><span>$2</span></div>');
    
    // Handle checkmarks (✓)
    formatted = formatted.replace(/^✓\s(.+)$/gm, '<div class="flex items-start space-x-2 my-1"><span class="text-green-400 text-sm">✓</span><span class="text-green-200">$1</span></div>');
    
    // Handle section headers (text followed by colon)
    formatted = formatted.replace(/^([A-Z][^:]*):$/gm, '<div class="font-medium text-blue-300 mt-3 mb-2 text-sm">$1:</div>');
    
    // Handle numbered sections
    formatted = formatted.replace(/^\*\*([^*]+)\*\*$/gm, '<div class="font-medium text-blue-300 mt-3 mb-2">$1</div>');
    
    // Handle inline code or values (numbers with $ or %)
    formatted = formatted.replace(/(\$[\d,]+(?:\.\d+)?(?:\/[a-zA-Z]+)?)/g, '<span class="font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">$1</span>');
    formatted = formatted.replace(/([\d.]+%)/g, '<span class="font-mono text-amber-400 bg-purple-500/10 px-1 rounded">$1</span>');
    
    // Handle confidence percentages
    formatted = formatted.replace(/Confidence:\s*(\d+%)/g, 'Confidence: <span class="font-mono text-blue-400">$1</span>');
    
    // Handle status indicators
    formatted = formatted.replace(/\*\*([A-Z\s]+)\*\*:/g, '<span class="font-semibold text-blue-400">$1:</span>');
    
    // Handle line breaks
    formatted = formatted.replace(/\n\n/g, '<br><br>');
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  };

  return (
    <div 
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
};

export default MarkdownRenderer;