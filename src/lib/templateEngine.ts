import Handlebars from 'handlebars';

export interface VariableConfig {
  tag: string;
  label: string;
  category: 'Contact' | 'Company' | 'Personalization' | 'Sender';
  required: boolean;
  fallback: string | null;
  behavior: 'replace' | 'remove' | 'remove_block';
}

export const VARIABLE_REGISTRY: Record<string, VariableConfig> = {
  firstName: { tag: '{{firstName}}', label: 'First Name', category: 'Contact', required: false, fallback: 'there', behavior: 'replace' },
  lastName: { tag: '{{lastName}}', label: 'Last Name', category: 'Contact', required: false, fallback: null, behavior: 'remove' },
  email: { tag: '{{email}}', label: 'Email', category: 'Contact', required: false, fallback: null, behavior: 'remove' },
  title: { tag: '{{title}}', label: 'Title', category: 'Contact', required: false, fallback: 'your role', behavior: 'replace' },
  companyName: { tag: '{{companyName}}', label: 'Company Name', category: 'Company', required: true, fallback: 'your company', behavior: 'replace' },
  website: { tag: '{{website}}', label: 'Website', category: 'Company', required: false, fallback: null, behavior: 'remove' },
  industry: { tag: '{{industry}}', label: 'Industry', category: 'Company', required: false, fallback: 'your industry', behavior: 'replace' },
  companySize: { tag: '{{companySize}}', label: '# Employees', category: 'Company', required: false, fallback: null, behavior: 'remove' },
  companyPhone: { tag: '{{companyPhone}}', label: 'Company Phone', category: 'Company', required: false, fallback: null, behavior: 'remove' },
  personLinkedinUrl: { tag: '{{personLinkedinUrl}}', label: 'Person Linkedin Url', category: 'Contact', required: false, fallback: null, behavior: 'remove' },
  city: { tag: '{{city}}', label: 'City', category: 'Contact', required: false, fallback: null, behavior: 'remove' },
  personalization: { tag: '{{personalization}}', label: 'Personalization', category: 'Personalization', required: false, fallback: null, behavior: 'remove_block' },
  personalizedLine: { tag: '{{personalizedLine}}', label: 'Personalization Line', category: 'Personalization', required: false, fallback: null, behavior: 'remove_block' },
  senderName: { tag: '{{senderName}}', label: 'Sender Name', category: 'Sender', required: true, fallback: 'TripGain Team', behavior: 'replace' },
  senderCompany: { tag: '{{senderCompany}}', label: 'Sender Company', category: 'Sender', required: true, fallback: 'TripGain', behavior: 'replace' },
};

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variablesFound: string[];
}

export class TemplateEngine {
  /**
   * Cleans and normalizes HTML for Handlebars parsing.
   * Preserves rich formatting (<a>, <strong>, <em>, <u>, <p>, <br>, <ul>, <ol>, <li>)
   * while sanitizing non-breaking spaces and rogue HTML tags INSIDE {{...}} blocks.
   */
  static htmlToHandlebars(html: string): string {
    if (!html) return '';

    let text = html;

    // Step 1: Normalize non-breaking spaces across the whole document
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/&#xA0;/gi, ' ')
      .replace(/\u00A0/g, ' ');

    // Step 2: Clean inside {{ ... }} blocks: strip any accidental HTML formatting tags inside handlebars tags
    text = text.replace(/\{\{([^{}]+)\}\}/g, (match, inner) => {
      // Strip any HTML tags that might have leaked into the variable tag itself (e.g. {{<strong>var</strong>}})
      const cleanedInner = inner.replace(/<[^>]+>/g, '').trim();
      return `{{${cleanedInner}}}`;
    });

    // Step 3: Decode common HTML entities in handlebars blocks
    text = text
      .replace(/&#125;/g, '}')
      .replace(/&#x7D;/gi, '}')
      .replace(/&#123;/g, '{')
      .replace(/&#x7B;/gi, '{');

    return text.trim();
  }

  /**
   * Renders a template given data using Handlebars for robust block parsing.
   * mode: 'strict' blocks rendering if required missing; 'flexible' allows it.
   */
  static renderTemplate(templateStr: string, data: Record<string, any>, mode: 'Strict' | 'Standard' | 'Flexible' = 'Standard', highlightVariables = false): string {
    if (!templateStr) return '';

    // Normalise: strip HTML wrapper added by ReactQuill and balance unclosed tags before Handlebars parsing
    const plainTemplate = TemplateEngine.autoBalanceTags(TemplateEngine.htmlToHandlebars(templateStr));

    try {
      const template = Handlebars.compile(plainTemplate, { noEscape: true });
      
      const processedData: Record<string, any> = {};
      
      for (const key of Object.keys(VARIABLE_REGISTRY)) {
        const config = VARIABLE_REGISTRY[key];
        let rawVal = data[key];

        // Bidirectional fallback between personalization and personalizedLine
        if ((rawVal === undefined || rawVal === null || rawVal.toString().trim() === '') && key === 'personalization') {
          rawVal = data.personalizedLine;
        } else if ((rawVal === undefined || rawVal === null || rawVal.toString().trim() === '') && key === 'personalizedLine') {
          rawVal = data.personalization;
        }

        const isMissing = rawVal === undefined || rawVal === null || rawVal.toString().trim() === '';
        
        if (!isMissing) {
          if (highlightVariables) {
            processedData[key] = new Handlebars.SafeString(`<span class="bg-blue-100 text-blue-800 px-1 rounded mx-0.5 whitespace-pre-wrap" title="${key}">${rawVal}</span>`);
          } else {
            processedData[key] = rawVal;
          }
        } else {
          if (highlightVariables && config?.required) {
            processedData[key] = new Handlebars.SafeString(`<span class="bg-red-100 text-red-800 px-1 rounded mx-0.5 font-bold" title="Missing required variable ${key}">[MISSING ${key}]</span>`);
          } else {
            processedData[key] = "";
          }
        }
      }

      // Also process any custom keys in data that aren't explicitly in VARIABLE_REGISTRY
      for (const key of Object.keys(data)) {
        if (!processedData.hasOwnProperty(key)) {
          const rawVal = data[key];
          const isMissing = rawVal === undefined || rawVal === null || rawVal.toString().trim() === '';
          if (!isMissing) {
            if (highlightVariables) {
              processedData[key] = new Handlebars.SafeString(`<span class="bg-blue-100 text-blue-800 px-1 rounded mx-0.5 whitespace-pre-wrap" title="${key}">${rawVal}</span>`);
            } else {
              processedData[key] = rawVal;
            }
          } else {
            processedData[key] = "";
          }
        }
      }
      
      let output = template(processedData);
      
      // Clean up double spaces or grammar issues (basic)
      output = output.replace(/ {2,}/g, ' ');
      output = output.replace(/ ,/g, ',');
      output = output.replace(/ \./g, '.');
      output = output.replace(/\n{3,}/g, '\n\n');
  
      return output.trim();
    } catch (e: any) {
      // If Handlebars parsing fails, return the raw template or error msg
      return highlightVariables 
        ? `<span class="text-red-600 font-bold">Template Syntax Error: ${e.message}</span>`
        : plainTemplate;
    }
  }

  static autoBalanceTags(templateStr: string): string {
    if (!templateStr) return '';
    let result = templateStr;
    const blocks = ['if', 'unless', 'each', 'with'];
    for (const block of blocks) {
      const openMatches = result.match(new RegExp(`\\{\\{#${block}\\b[^}]*\\}\\}`, 'g')) || [];
      const closeMatches = result.match(new RegExp(`\\{\\{/${block}\\}\\}`, 'g')) || [];
      const diff = openMatches.length - closeMatches.length;
      if (diff > 0) {
        result = result.trimEnd() + '\n' + `{{/${block}}}\n`.repeat(diff).trimEnd();
      }
    }
    return result;
  }

  static validateTemplate(templateStr: string): TemplateValidationResult {
    const result: TemplateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      variablesFound: []
    };

    if (!templateStr) return result;

    // Strip HTML and auto-balance unclosed blocks before validating
    let plainTemplate = TemplateEngine.htmlToHandlebars(templateStr);
    plainTemplate = TemplateEngine.autoBalanceTags(plainTemplate);

    try {
      // Handlebars parse will throw on mismatched #if / /if
      const ast = Handlebars.parse(plainTemplate);
      
      const foundVars = new Set<string>();
      
      // Basic AST traversal to find variables
      const traverse = (node: any) => {
        if (node.type === 'MustacheStatement' || node.type === 'BlockStatement') {
          if (node.path && node.path.original) {
            const varName = node.path.original;
            if (varName !== 'if' && varName !== 'else' && varName !== 'unless') {
              foundVars.add(varName);
            }
          }
        }
        if (node.params) node.params.forEach(traverse);
        if (node.program) node.program.body.forEach(traverse);
        if (node.inverse) node.inverse.body.forEach(traverse);
      };
      
      ast.body.forEach(traverse);
      result.variablesFound = Array.from(foundVars);

      // Validate variables against registry
      for (const v of result.variablesFound) {
        const config = VARIABLE_REGISTRY[v];
        if (!config) {
          result.isValid = false;
          result.errors.push(`Unknown variable: {{${v}}}`);
        }
      }
    } catch (e: any) {
      result.isValid = false;
      result.errors.push(`Syntax error: ${e.message}`);
    }

    return result;
  }
}


