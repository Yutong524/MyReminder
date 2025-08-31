export function slugifyTitle(title) {
    const base = title
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
    const rand = Math.random().toString(36).slice(2, 6);
    return base ? `${base}-${rand}` : `m-${rand}`;
}
