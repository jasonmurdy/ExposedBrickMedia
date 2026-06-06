/**
 * Sanitizes a Puck page layout to maintain structural integrity and prevent
 * "Cannot read properties of null (reading 'props')" type execution crashes
 * inside Puck's Render or similar components due to corrupted or improperly pruned data.
 */

function sanitizeItem(item: any, path: string = "node", seenIds?: Set<string>): any {
  if (!item || typeof item !== 'object') return null;

  const sanitized: any = { ...item };
  
  // Ensure we have a valid, deterministic, and UNIQUE ID (required by Puck)
  let cid = sanitized.id;
  if (!cid || (seenIds && seenIds.has(cid))) {
    let suffix = 1;
    // Generate a clean, unique ID if missing or already seen
    let newId = cid ? `${cid}-dup${suffix}` : `${sanitized.type || 'Block'}-${path}`;
    if (seenIds) {
      while (seenIds.has(newId)) {
        suffix++;
        newId = cid ? `${cid}-dup${suffix}` : `${sanitized.type || 'Block'}-${path}-${suffix}`;
      }
    }
    cid = newId;
  }
  
  sanitized.id = cid;
  if (seenIds) {
    seenIds.add(cid);
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

  // --- AUTOMATIC SLOT MIGRATION & ADAPTATION ---
  // Remap standard children/content array according to the component type's slot configuration
  const compType = sanitized.type;
  if (compType) {
    // 1. FlexBox, GridBox, MediaBackground expect their slots to be named 'content'
    if (["FlexBox", "GridBox", "MediaBackground"].includes(compType)) {
      if (Array.isArray(sanitized.props.children) && (!sanitized.props.content || sanitized.props.content.length === 0)) {
        sanitized.props.content = sanitized.props.children;
        delete sanitized.props.children;
      }
    }
    // 2. Columns component expects 'left' and 'right' slots rather than a single 'children' array
    if (compType === "Columns") {
      if (Array.isArray(sanitized.props.children)) {
        const colsChildren = sanitized.props.children;
        if (!sanitized.props.left || sanitized.props.left.length === 0) {
          sanitized.props.left = colsChildren.slice(0, 1);
        }
        if (!sanitized.props.right || sanitized.props.right.length === 0) {
          sanitized.props.right = colsChildren.slice(1);
        }
        delete sanitized.props.children;
      }
    }
  }

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
  sanitized.props = sanitizeProps(sanitized.props, path, seenIds);

  return sanitized;
}
function sanitizeProps(props: any, path: string = "props", seenIds?: Set<string>): any {
  if (!props || typeof props !== 'object') return {};
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(props)) {
    if (Array.isArray(value)) {
      // Check if this array seems to be composed of Puck component items or regular values
      sanitized[key] = sanitizeArray(value, `${path}-${key}`, seenIds);
    } else if (value && typeof value === 'object') {
      // Check if this sub-object is a Puck item
      if (typeof (value as any).type === 'string') {
        sanitized[key] = sanitizeItem(value, `${path}-${key}`, seenIds);
      } else {
        sanitized[key] = sanitizeProps(value, `${path}-${key}`, seenIds);
      }
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function sanitizeArray(arr: any[], path: string = "array", seenIds?: Set<string>): any[] {
  return arr
    .filter((item: any) => item !== null && typeof item === 'object')
    .map((item: any, idx: number) => {
      // If it has a type string, it's a Puck item
      if (typeof item.type === 'string') {
        return sanitizeItem(item, `${path}-${idx}`, seenIds);
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

  const seenIds = new Set<string>();

  // 1. Sanitize root
  if (!parsed.root || typeof parsed.root !== 'object') {
    parsed.root = { props: { title: fallbackTitle } };
  } else {
    parsed.root = sanitizeItem(parsed.root, "root", seenIds);
    if (!parsed.root.props.title && fallbackTitle) {
      parsed.root.props.title = fallbackTitle;
    }
  }

  // 2. Sanitize content array
  if (Array.isArray(parsed.content)) {
    parsed.content = sanitizeArray(parsed.content, "content", seenIds);
  } else {
    parsed.content = [];
  }

  // 3. Sanitize zones (ensure items are array, remove nulls/undefined & ensure proper structure)
  if (parsed.zones && typeof parsed.zones === 'object' && !Array.isArray(parsed.zones)) {
    const sanitizedZones: any = {};
    for (const [zoneName, zoneItems] of Object.entries(parsed.zones)) {
      if (Array.isArray(zoneItems)) {
        sanitizedZones[zoneName] = sanitizeArray(zoneItems, `zone-${zoneName}`, seenIds);
      } else {
        sanitizedZones[zoneName] = [];
      }
    }
    parsed.zones = sanitizedZones;
  }

  return parsed;
}

/**
 * Robust JSON layout sanitization function as specified in the diagnostics PDF.
 * Ensures recursive validation of component arrays (including `children`)
 * with guaranteed unique IDs for seamless visual hydration in @measured/puck.
 */
export function sanitizeLayoutData(data: any, seenIds?: Set<string>): any {
  if (!data || typeof data !== 'object') return {};

  const localSeenIds = seenIds || new Set<string>();

  return {
    content: Array.isArray(data.content) ? data.content.map((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return null;

      let cid = item.id;
      if (!cid || localSeenIds.has(cid)) {
        let suffix = 1;
        let newId = cid ? `${cid}-dup${suffix}` : `${item.type || 'Block'}-node-${idx}`;
        while (localSeenIds.has(newId)) {
          suffix++;
          newId = cid ? `${cid}-dup${suffix}` : `${item.type || 'Block'}-node-${idx}-${suffix}`;
        }
        cid = newId;
      }
      localSeenIds.add(cid);

      return {
        id: cid,
        type: item.type,
        props: item.props || {},
        children: Array.isArray(item.children) ? sanitizeLayoutData({ content: item.children }, localSeenIds).content : []
      };
    }).filter(Boolean) : [],
    root: data.root || { props: { title: "Default Layout", layoutMode: "one-panel" } }
  };
}

