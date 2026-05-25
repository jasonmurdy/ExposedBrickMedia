/**
 * Sanitizes a Puck page layout to maintain structural integrity and prevent
 * "Cannot read properties of null (reading 'props')" type execution crashes
 * inside Puck's Render or similar components due to corrupted or improperly pruned data.
 */

function sanitizeItem(item: any): any {
  if (!item || typeof item !== 'object') return null;

  const sanitized: any = { ...item };
  
  // Ensure props is an object
  if (!sanitized.props || typeof sanitized.props !== 'object') {
    sanitized.props = {};
  } else {
    // Recursively sanitize props
    sanitized.props = sanitizeProps(sanitized.props);
  }

  // If item has zones, recursively sanitize them
  if (sanitized.zones && typeof sanitized.zones === 'object' && !Array.isArray(sanitized.zones)) {
    const sanitizedZones: any = {};
    for (const [zoneName, zoneItems] of Object.entries(sanitized.zones)) {
      if (Array.isArray(zoneItems)) {
        sanitizedZones[zoneName] = sanitizeArray(zoneItems);
      } else {
        sanitizedZones[zoneName] = [];
      }
    }
    sanitized.zones = sanitizedZones;
  }

  return sanitized;
}

function sanitizeProps(props: any): any {
  if (!props || typeof props !== 'object') return {};
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(props)) {
    if (Array.isArray(value)) {
      // Check if this array seems to be composed of Puck component items or regular values
      sanitized[key] = sanitizeArray(value);
    } else if (value && typeof value === 'object') {
      // Check if this sub-object is a Puck item
      if (typeof (value as any).type === 'string') {
        sanitized[key] = sanitizeItem(value);
      } else {
        sanitized[key] = sanitizeProps(value);
      }
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function sanitizeArray(arr: any[]): any[] {
  return arr
    .filter((item: any) => item !== null && typeof item === 'object')
    .map((item: any) => {
      // If it has a type string, it's a Puck item
      if (typeof item.type === 'string') {
        return sanitizeItem(item);
      }
      // Otherwise, keep it as is or try to sanitize its structure
      return item;
    })
    .filter(Boolean);
}

export function sanitizeLayout(layout: any, fallbackTitle: string = ''): any {
  if (!layout) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(JSON.stringify(layout));
  } catch (e) {
    // Elegant fallback parsing for circular references
    const cache = new WeakSet();
    const prune = (val: any): any => {
      if (val === null || typeof val !== 'object') return val;
      if (cache.has(val)) return undefined;
      cache.add(val);
      if (Array.isArray(val)) {
        return val.map(prune).filter(item => item !== undefined);
      }
      const cleaned: any = {};
      for (const [k, v] of Object.entries(val)) {
        const prunedVal = prune(v);
        if (prunedVal !== undefined) {
          cleaned[k] = prunedVal;
        }
      }
      return cleaned;
    };
    parsed = prune(layout);
  }

  if (!parsed || typeof parsed !== 'object') return null;

  // 1. Sanitize root
  if (!parsed.root || typeof parsed.root !== 'object') {
    parsed.root = { props: { title: fallbackTitle } };
  } else {
    parsed.root = sanitizeItem(parsed.root);
    if (!parsed.root.props.title && fallbackTitle) {
      parsed.root.props.title = fallbackTitle;
    }
  }

  // 2. Sanitize content array
  if (Array.isArray(parsed.content)) {
    parsed.content = sanitizeArray(parsed.content);
  } else {
    parsed.content = [];
  }

  // 3. Sanitize zones (ensure items are array, remove nulls/undefined & ensure proper structure)
  if (parsed.zones && typeof parsed.zones === 'object' && !Array.isArray(parsed.zones)) {
    const sanitizedZones: any = {};
    for (const [zoneName, zoneItems] of Object.entries(parsed.zones)) {
      if (Array.isArray(zoneItems)) {
        sanitizedZones[zoneName] = sanitizeArray(zoneItems);
      } else {
        sanitizedZones[zoneName] = [];
      }
    }
    parsed.zones = sanitizedZones;
  }

  return parsed;
}
