import { useMemo } from 'react';
import { useMasterData } from '../api/useMasterData';
import { MASTER_CATEGORIES } from '../screens/admin/MasterDataAdmin';

/**
 * Normalizes a plant name string for comparison.
 */
export function normalizePlant(name?: string): string {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Returns dynamic plant options configured in Enterprise Master Data.
 * Pulls from local storage `logiq_master_plants`, active API data, or canonical defaults.
 */
export function useDynamicPlants(): string[] {
  const { data: apiPlants } = useMasterData('plants');

  return useMemo(() => {
    // 1. Local Storage (Master Data admin updates save here directly)
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('logiq_master_plants');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const names = parsed
              .map((p: any) => (p.name || p.code || p.id || String(p)).trim())
              .filter(Boolean);
            if (names.length > 0) return Array.from(new Set(names));
          }
        }
      } catch {}
    }

    // 2. Remote API Query
    if (Array.isArray(apiPlants) && apiPlants.length > 0) {
      const names = apiPlants
        .map((p: any) => (p.name || p.code || p.id || String(p)).trim())
        .filter(Boolean);
      if (names.length > 0) return Array.from(new Set(names));
    }

    // 3. Fallback to MASTER_CATEGORIES defaults
    const cat = MASTER_CATEGORIES.find((c) => c.id === 'plants');
    if (cat && cat.defaultItems.length > 0) {
      return cat.defaultItems.map((p) => p.name || p.code || p.id);
    }

    return ['Plant-V', 'Aurangabad', 'Corporate / Central'];
  }, [apiPlants]);
}

/**
 * Returns dynamic departments configured in Enterprise Master Data,
 * optionally filtered by a specific plant.
 */
export function useDynamicDepartments(filterPlant?: string): string[] {
  const { data: apiDepts } = useMasterData('departments');

  return useMemo(() => {
    let rawList: any[] = [];

    // 1. Local Storage
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('logiq_master_departments');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawList = parsed;
          }
        }
      } catch {}
    }

    // 2. Remote API Query
    if (rawList.length === 0 && Array.isArray(apiDepts) && apiDepts.length > 0) {
      rawList = apiDepts;
    }

    // 3. Fallback to MASTER_CATEGORIES
    if (rawList.length === 0) {
      const cat = MASTER_CATEGORIES.find((c) => c.id === 'departments');
      if (cat && cat.defaultItems.length > 0) {
        rawList = cat.defaultItems;
      }
    }

    if (rawList.length === 0) {
      rawList = [
        { name: 'Press Shop & Notching', plant: 'Plant-V' },
        { name: 'Assembly', plant: 'Aurangabad' },
        { name: 'Machine Shop', plant: 'Plant-V' },
        { name: 'Die Casting', plant: 'Plant-V' },
        { name: 'CTL / SLT', plant: 'Plant-V' },
        { name: 'Tool Room', plant: 'Plant-V' },
        { name: 'Quality Assurance', plant: 'Plant-V' },
      ];
    }

    // Filter by plant if a specific plant is selected
    if (filterPlant && filterPlant !== 'All Plants' && filterPlant !== 'Corporate / Central') {
      const normPlant = normalizePlant(filterPlant);
      const filtered = rawList.filter((d) => {
        if (!d.plant) return true; // generic department available to all plants
        const dPlant = normalizePlant(d.plant);
        return dPlant.includes(normPlant) || normPlant.includes(dPlant);
      });

      if (filtered.length > 0) {
        return Array.from(
          new Set(
            filtered
              .map((d) => (d.name || d.code || String(d)).trim())
              .filter(Boolean)
          )
        );
      }
    }

    return Array.from(
      new Set(
        rawList
          .map((d) => (d.name || d.code || String(d)).trim())
          .filter(Boolean)
      )
    );
  }, [apiDepts, filterPlant]);
}

/**
 * Determines which plants a user has access to based on their role and profile.
 * - Super Admin (`role_admin`) has access to all plants configured in Master Data.
 * - Shopfloor users (Operator, Supervisor, QA) have access strictly to their assigned plant.
 */
export function getUserAccessiblePlants(
  userPlant?: string,
  role?: string,
  allPlants: string[] = ['Plant-V', 'Aurangabad']
): string[] {
  if (role === 'role_admin' || userPlant === 'Corporate / Central') {
    return allPlants;
  }
  if (userPlant) {
    return [userPlant];
  }
  return allPlants.length > 0 ? [allPlants[0]] : ['Plant-V'];
}
