/**
 * Sanitizes a Puck page layout to maintain structural integrity and prevent
 * "Cannot read properties of null (reading 'props')" type execution crashes
 * inside Puck's Render or similar components due to corrupted or improperly pruned data.
 */

function sanitizeItem(item: any, path: string = "node"): any {
  if (!item || typeof item !== 'object') return null;

  const sanitized: any = { ...item };
  
  // Ensure we have a valid, deterministic ID if missing (required by Puck)
  if (!sanitized.id) {
    sanitized.id = `${sanitized.type || 'Block'}-${path}`;
  }

  // Ensure props is an object
  if (!sanitized.props || typeof sanitized.props !== 'object') {
    sanitized.props = {};
  }

  // Move peer slot arrays (children, content, left, right, main, side) into props
  const slotNames = ["children", "content", "left", "right", "main", "side"];
  for (const slotName of slotNames) {
    if (Array.isArray(sanitized[slotName])) {
      sanitized.props[slotName] = sanitized[slotName];
      delete sanitized[slotName];
    }
  }

  // --- AUTOMATIC SLOT MIGRATION ---
  // If the legacy 'zones' object exists, move its contents directly into 'props'
  if (sanitized.zones && typeof sanitized.zones === 'object' && !Array.isArray(sanitized.zones)) {
    for (const [zoneName, zoneItems] of Object.entries(sanitized.zones)) {
      if (Array.isArray(zoneItems)) {
        // Inject the old zone items into the props object so Puck treats them as Slots
        sanitized.props[zoneName] = zoneItems;
      }
    }
    // Delete the legacy zones object entirely so Puck doesn't revert to old behaviors
    delete sanitized.zones;
  }

  // Recursively sanitize props, passing path context
  sanitized.props = sanitizeProps(sanitized.props, path);

  return sanitized;
}
function sanitizeProps(props: any, path: string = "props"): any {
  if (!props || typeof props !== 'object') return {};
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(props)) {
    if (Array.isArray(value)) {
      // Check if this array seems to be composed of Puck component items or regular values
      sanitized[key] = sanitizeArray(value, `${path}-${key}`);
    } else if (value && typeof value === 'object') {
      // Check if this sub-object is a Puck item
      if (typeof (value as any).type === 'string') {
        sanitized[key] = sanitizeItem(value, `${path}-${key}`);
      } else {
        sanitized[key] = sanitizeProps(value, `${path}-${key}`);
      }
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function sanitizeArray(arr: any[], path: string = "array"): any[] {
  return arr
    .filter((item: any) => item !== null && typeof item === 'object')
    .map((item: any, idx: number) => {
      // If it has a type string, it's a Puck item
      if (typeof item.type === 'string') {
        const childId = item.id || `${item.type}-${path}-${idx}`;
        const sanitizedItem = sanitizeItem(item, `${path}-${idx}`);
        sanitizedItem.id = childId;
        return sanitizedItem;
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
    parsed.root = sanitizeItem(parsed.root, "root");
    if (!parsed.root.props.title && fallbackTitle) {
      parsed.root.props.title = fallbackTitle;
    }
  }

  // 2. Sanitize content array
  if (Array.isArray(parsed.content)) {
    parsed.content = sanitizeArray(parsed.content, "content");
  } else {
    parsed.content = [];
  }

  // 3. Sanitize zones (ensure items are array, remove nulls/undefined & ensure proper structure)
  if (parsed.zones && typeof parsed.zones === 'object' && !Array.isArray(parsed.zones)) {
    const sanitizedZones: any = {};
    for (const [zoneName, zoneItems] of Object.entries(parsed.zones)) {
      if (Array.isArray(zoneItems)) {
        sanitizedZones[zoneName] = sanitizeArray(zoneItems, `zone-${zoneName}`);
      } else {
        sanitizedZones[zoneName] = [];
      }
    }
    parsed.zones = sanitizedZones;
  }

  return parsed;
}
