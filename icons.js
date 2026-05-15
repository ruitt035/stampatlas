const icons = {
  calendar:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  pin:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/><path d="M12 10.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z"/></svg>',
  export:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 21h14a2 2 0 0 0 2-2v-4"/><path d="M3 15v4a2 2 0 0 0 2 2"/></svg>',
  settings:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8.7 8.7 0 0 0-1.7-1L15 3h-6l-.4 2.9a8.7 8.7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.9 7.9 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a8.7 8.7 0 0 0 1.7 1L9 21h6l.4-2.9a8.7 8.7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5Z"/></svg>',
  trash:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 14h10l1-14"/><path d="M9 7V4h6v3"/></svg>',
  close:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>',
  image:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="m8 11 3 3 5-5 4 4"/><path d="M8.5 9.2a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Z"/></svg>',
  locate:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/></svg>',
  records:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h1"/><path d="M3 12h1"/><path d="M3 18h1"/></svg>',
  chevronLeft:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  chevronRight:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  sort:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18H4"/><path d="M20 6H4"/><path d="M14 12H4"/><path d="M17 18l3-3 3 3"/><path d="M20 15V6"/></svg>',
  edit:
    '<svg class="btnIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>',
}

export function icon(name) {
  return icons[name] ?? ""
}
