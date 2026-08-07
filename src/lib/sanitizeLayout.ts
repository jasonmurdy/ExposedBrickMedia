/**
 * Sanitizes a Puck page layout to maintain structural integrity and prevent
 * "Cannot read properties of null (reading 'props')" type execution crashes
 * inside Puck's Render or similar components due to corrupted or improperly pruned data.
 * Resolves duplicate React keys and warnings in DropZone and LayerTree by ensuring
 * clean ID assignment.
 */

import { transformProps, Data } from "@puckeditor/core";

export const migrateSavedLayout = (data: any): any => {
  if (!data || !data.content) return data;
  return transformProps(data as Data, {
    ProjectDetailView: ({ legacyGalleryStyle, ...props }: any) => ({
      mobileGalleryMode: legacyGalleryStyle === "grid" ? "stack" : "carousel",
      ...props,
    }),
  });
};

function sanitizePrimaryItem(item: any, path: string, seenIds: Set<string>, idRemap: Map<string, string>): any {
  if (!item || typeof item !== 'object') return null;

  const sanitized = { ...item };
  
  // Ensure we have a valid component type
  if (!sanitized.type || typeof sanitized.type !== 'string') {
    sanitized.type = "TextContent"; // safe default
  }

  // Ensure we have a valid, unique ID
  let cid = sanitized.id !== undefined && sanitized.id !== null ? String(sanitized.id).trim() : "";
  if (!cid && sanitized.props && typeof sanitized.props === 'object' && sanitized.props.id) {
    cid = String(sanitized.props.id).trim();
  }
  const originalCid = cid;

  if (!cid || seenIds.has(cid)) {
    let suffix = 1;
    const baseId = cid ? cid : `${sanitized.type || 'Block'}-${path}`;
    let newId = baseId;
    while (seenIds.has(newId)) {
      newId = `${baseId}-dup${suffix}`;
      suffix++;
    }
    cid = newId;
  }

  sanitized.id = cid;
  seenIds.add(cid);

  if (originalCid && originalCid !== cid) {
    idRemap.set(originalCid, cid);
  }

  // Ensure props is an object
  if (!sanitized.props || typeof sanitized.props !== 'object') {
    sanitized.props = {};
  } else {
    sanitized.props = { ...sanitized.props };
  }

  // Ensure top-level ID matches inside props if applicable
  if (sanitized.props.id !== undefined) {
    sanitized.props.id = cid;
  }

  // Clear peer slot properties inside props so they are not double-processed or duplicated
  const slotNames = ["children", "content", "left", "right", "main", "side"];
  for (const name of slotNames) {
    if (Array.isArray(sanitized.props[name])) {
      delete sanitized.props[name];
    }
  }

  return sanitized;
}

function adaptSlots(item: any) {
  if (!item || typeof item !== 'object') return;

  const compType = item.type;
  if (compType && item.props && typeof item.props === 'object') {
    // 1. FlexBox, GridBox, MediaBackground expect their slots to be named 'content'
    if (["FlexBox", "GridBox", "MediaBackground"].includes(compType)) {
      if (Array.isArray(item.props.children) && (!item.props.content || item.props.content.length === 0)) {
        item.props.content = item.props.children;
        delete item.props.children;
      }
    }
    // 2. Columns component expects 'left' and 'right' slots rather than a single 'children' array
    if (compType === "Columns") {
      if (Array.isArray(item.props.children)) {
        const colsChildren = item.props.children;
        if (!item.props.left || item.props.left.length === 0) {
          item.props.left = colsChildren.slice(0, 1);
        }
        if (!item.props.right || item.props.right.length === 0) {
          item.props.right = colsChildren.slice(1);
        }
        delete item.props.children;
      }
    }
  }

  // Recursively adapt nested items inside props
  if (item.props && typeof item.props === 'object') {
    for (const value of Object.values(item.props)) {
      if (Array.isArray(value)) {
        for (const arrItem of value) {
          adaptSlots(arrItem);
        }
      } else if (value && typeof value === 'object') {
        adaptSlots(value);
      }
    }
  }
}

function extractSlotsToZones(item: any, parentId: string, zones: any) {
  if (!item || typeof item !== 'object') return;

  if (item.props && typeof item.props === 'object') {
    for (const [key, value] of Object.entries(item.props)) {
      if (Array.isArray(value)) {
        const isSlotArray = value.length > 0 && typeof value[0] === 'object' && value[0] !== null && typeof value[0].type === 'string';
        if (isSlotArray) {
          const zoneKey = `${parentId}:${key}`;
          if (!zones[zoneKey]) {
            zones[zoneKey] = value;
          }
          delete item.props[key];
        } else {
          for (const arrItem of value) {
            if (arrItem && typeof arrItem === 'object') {
              extractSlotsToZones(arrItem, parentId, zones);
            }
          }
        }
      } else if (value && typeof value === 'object') {
        if (typeof (value as any).type === 'string') {
          const childId = (value as any).id || `nested-${Math.random().toString(36).substr(2, 9)}`;
          extractSlotsToZones(value, childId, zones);
        } else {
          extractSlotsToZones(value, parentId, zones);
        }
      }
    }
  }
}

function extractAllLayoutSlots(parsed: any) {
  if (!parsed.zones) parsed.zones = {};

  // 1. Extract from root
  if (parsed.root) {
    const rootId = parsed.root.id || "root";
    extractSlotsToZones(parsed.root, rootId, parsed.zones);
  }

  // 2. Extract from content
  if (Array.isArray(parsed.content)) {
    parsed.content.forEach((item: any) => {
      if (item && item.id) {
        extractSlotsToZones(item, item.id, parsed.zones);
      }
    });
  }

  // 3. Extract from existing zones recursively
  let keys = Object.keys(parsed.zones);
  const processed = new Set<string>();
  while (keys.some(k => !processed.has(k))) {
    for (const key of keys) {
      if (processed.has(key)) continue;
      processed.add(key);
      const items = parsed.zones[key];
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          if (item && item.id) {
            extractSlotsToZones(item, item.id, parsed.zones);
          }
        });
      }
    }
    keys = Object.keys(parsed.zones);
  }
}

function syncSlotsToProps(item: any, zones: any) {
  if (!item || typeof item !== 'object' || !item.id) return;

  if (!item.props || typeof item.props !== 'object') {
    item.props = {};
  }

  const itemId = item.id;
  for (const zoneKey of Object.keys(zones)) {
    if (zoneKey.startsWith(`${itemId}:`)) {
      const slotName = zoneKey.substring(itemId.length + 1);
      item.props[slotName] = zones[zoneKey];
    }
  }
}

export function sanitizeLayout(layout: any, fallbackTitle: string = ''): any {
  const getSafeFallback = () => ({
    content: [],
    root: { id: "root", type: "root", props: { title: fallbackTitle || "Page" } },
    zones: {}
  });

  if (!layout || typeof layout !== 'object') return getSafeFallback();

  let parsed: any;
  try {
    parsed = JSON.parse(JSON.stringify(layout));
  } catch (e) {
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

  if (!parsed || typeof parsed !== 'object') return getSafeFallback();

  // Run dynamic prop migrations
  parsed = migrateSavedLayout(parsed);

  // Adapt legacy properties like children arrays recursively
  if (parsed.root) adaptSlots(parsed.root);
  if (Array.isArray(parsed.content)) parsed.content.forEach(adaptSlots);
  if (parsed.zones && typeof parsed.zones === 'object' && !Array.isArray(parsed.zones)) {
    for (const zoneItems of Object.values(parsed.zones)) {
      if (Array.isArray(zoneItems)) {
        zoneItems.forEach(adaptSlots);
      }
    }
  }

  // Move nested slot lists into the top level parsed.zones object to flat-process them
  extractAllLayoutSlots(parsed);

  const seenIds = new Set<string>();
  const idRemap = new Map<string, string>();

  // 1. Sanitize root block (must be 'root')
  if (!parsed.root || typeof parsed.root !== 'object') {
    parsed.root = { id: "root", type: "root", props: { title: fallbackTitle } };
  } else {
    parsed.root.id = "root";
    parsed.root = sanitizePrimaryItem(parsed.root, "root", seenIds, idRemap);
    if (!parsed.root.props.title && fallbackTitle) {
      parsed.root.props.title = fallbackTitle;
    }
  }

  // 2. Sanitize top-level content list
  if (Array.isArray(parsed.content)) {
    parsed.content = parsed.content
      .map((item: any, idx: number) => sanitizePrimaryItem(item, `content-${idx}`, seenIds, idRemap))
      .filter(Boolean);
  } else {
    parsed.content = [];
  }

  // 3. Sanitize flat zones list
  if (parsed.zones && typeof parsed.zones === 'object' && !Array.isArray(parsed.zones)) {
    const sanitizedZones: any = {};
    for (const [zoneName, zoneItems] of Object.entries(parsed.zones)) {
      if (Array.isArray(zoneItems)) {
        sanitizedZones[zoneName] = zoneItems
          .map((item: any, idx: number) => sanitizePrimaryItem(item, `zone-${zoneName}-${idx}`, seenIds, idRemap))
          .filter(Boolean);
      } else {
        sanitizedZones[zoneName] = [];
      }
    }
    parsed.zones = sanitizedZones;
  } else {
    parsed.zones = {};
  }

  // 4. Align zone keys with any remapped block IDs to keep layouts correctly linked
  if (idRemap.size > 0) {
    const finalZones: any = {};
    for (const [zoneKey, zoneItems] of Object.entries(parsed.zones)) {
      let updatedKey = zoneKey;
      const colonIdx = zoneKey.indexOf(":");
      if (colonIdx !== -1) {
        const blockId = zoneKey.substring(0, colonIdx);
        const zoneName = zoneKey.substring(colonIdx + 1);
        if (idRemap.has(blockId)) {
          updatedKey = `${idRemap.get(blockId)}:${zoneName}`;
        }
      } else {
        if (idRemap.has(zoneKey)) {
          updatedKey = idRemap.get(zoneKey)!;
        }
      }
      finalZones[updatedKey] = zoneItems;
    }
    parsed.zones = finalZones;
  }

  // 5. Sync flat zones content back to the corresponding inline props of each block
  syncSlotsToProps(parsed.root, parsed.zones);
  parsed.content.forEach((item: any) => {
    syncSlotsToProps(item, parsed.zones);
  });
  for (const zoneItems of Object.values(parsed.zones)) {
    if (Array.isArray(zoneItems)) {
      zoneItems.forEach((item: any) => {
        syncSlotsToProps(item, parsed.zones);
      });
    }
  }

  return parsed;
}

/**
 * Robust JSON layout sanitization function as specified in the diagnostics PDF.
 * Ensures recursive validation of component arrays (including `children`)
 * with guaranteed unique IDs for seamless visual hydration in @puckeditor/core.
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
