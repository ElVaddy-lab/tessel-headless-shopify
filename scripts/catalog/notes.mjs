// Fragrance notes → `fragrance_note` metaobjects. Handle is the key used in products.mjs.

export const NOTES = [
  // Citrus
  { handle: 'bergamot', name: 'Bergamot', group: 'Citrus', description: 'Bright citrus peel with a soft, tea-like bitterness.' },
  { handle: 'yuzu', name: 'Yuzu', group: 'Citrus', description: 'Tart Japanese citrus, somewhere between grapefruit and mandarin.' },
  { handle: 'lemon', name: 'Lemon', group: 'Citrus', description: 'Sharp, clean zest that lifts everything around it.' },
  { handle: 'grapefruit', name: 'Grapefruit', group: 'Citrus', description: 'Juicy and slightly bitter, with a sparkling edge.' },
  { handle: 'mandarin', name: 'Mandarin', group: 'Citrus', description: 'Sweet, rounded citrus with a gentle glow.' },
  { handle: 'bitter-orange', name: 'Bitter orange', group: 'Citrus', description: 'Zesty orange rind with a dry, green bite.' },

  // Floral
  { handle: 'neroli', name: 'Neroli', group: 'Floral', description: 'Orange tree blossom distilled: airy, green and luminous.' },
  { handle: 'orange-blossom', name: 'Orange blossom', group: 'Floral', description: 'Sunny white flowers, honeyed and warm.' },
  { handle: 'jasmine', name: 'Jasmine', group: 'Floral', description: 'Rich white flower, sweet with a faint animalic depth.' },
  { handle: 'magnolia', name: 'Magnolia', group: 'Floral', description: 'Creamy petals with a fresh, lemony lift.' },
  { handle: 'iris', name: 'Iris', group: 'Floral', description: 'Powdery and cool, like suede and dry earth.' },
  { handle: 'violet', name: 'Violet', group: 'Floral', description: 'Soft, slightly sweet flower with a hint of candy.' },
  { handle: 'rose', name: 'Rose', group: 'Floral', description: 'Velvety, deep and a little spicy.' },

  // Woody
  { handle: 'cedarwood', name: 'Cedarwood', group: 'Woody', description: 'Dry, pencil-shaving wood.' },
  { handle: 'sandalwood', name: 'Sandalwood', group: 'Woody', description: 'Creamy, smooth and milky wood.' },
  { handle: 'vetiver', name: 'Vetiver', group: 'Woody', description: 'Earthy grass root, smoky and green.' },
  { handle: 'guaiac-wood', name: 'Guaiac wood', group: 'Woody', description: 'Smoky wood with a soft, tarry sweetness.' },
  { handle: 'hinoki', name: 'Hinoki', group: 'Woody', description: 'Japanese cypress: clean, lemony wood, like a bathhouse.' },
  { handle: 'cypress', name: 'Cypress', group: 'Woody', description: 'Resinous evergreen, crisp and slightly bitter.' },

  // Amber
  { handle: 'amber', name: 'Amber', group: 'Amber', description: 'Warm, resinous and softly sweet.' },
  { handle: 'labdanum', name: 'Labdanum', group: 'Amber', description: 'Dark resin, leathery and balsamic.' },
  { handle: 'benzoin', name: 'Benzoin', group: 'Amber', description: 'Vanilla-like resin, cosy and smooth.' },
  { handle: 'olibanum', name: 'Olibanum', group: 'Amber', description: 'Frankincense: cool smoke with a citrus edge.' },
  { handle: 'myrrh', name: 'Myrrh', group: 'Amber', description: 'Bittersweet resin with a mushroomy depth.' },

  // Fresh
  { handle: 'sea-salt', name: 'Sea salt', group: 'Fresh', description: 'Mineral, sun-dried skin after a swim.' },
  { handle: 'mint', name: 'Mint', group: 'Fresh', description: 'Cooling and green, a clean breath of air.' },
  { handle: 'juniper', name: 'Juniper', group: 'Fresh', description: 'Gin-like berry, fresh and piney.' },

  // Gourmand
  { handle: 'pear', name: 'Pear', group: 'Gourmand', description: 'Juicy ripe pear with a crisp skin.' },
  { handle: 'tonka-bean', name: 'Tonka bean', group: 'Gourmand', description: 'Almond, hay and vanilla in one warm note.' },
  { handle: 'vanilla', name: 'Vanilla', group: 'Gourmand', description: 'Soft, round sweetness with a hint of smoke.' },
  { handle: 'almond', name: 'Almond', group: 'Gourmand', description: 'Marzipan-like, nutty and gentle.' },
  { handle: 'honey', name: 'Honey', group: 'Gourmand', description: 'Golden, waxy sweetness.' },
  { handle: 'cocoa', name: 'Cocoa', group: 'Gourmand', description: 'Dry, dark chocolate powder.' },

  // Green
  { handle: 'fig-leaf', name: 'Fig leaf', group: 'Green', description: 'Milky green leaf with a coconut-like softness.' },
  { handle: 'galbanum', name: 'Galbanum', group: 'Green', description: 'Sharp green resin, like snapped stems.' },
  { handle: 'tomato-leaf', name: 'Tomato leaf', group: 'Green', description: 'Bitter, vivid greenhouse green.' },
  { handle: 'basil', name: 'Basil', group: 'Green', description: 'Aromatic herb, fresh and slightly peppery.' },
  { handle: 'green-tea', name: 'Green tea', group: 'Green', description: 'Clean, light and slightly grassy.' },

  // Spicy
  { handle: 'pink-pepper', name: 'Pink pepper', group: 'Spicy', description: 'Fizzy, rosy spice.' },
  { handle: 'cardamom', name: 'Cardamom', group: 'Spicy', description: 'Cool, aromatic spice with a eucalyptus hint.' },
  { handle: 'saffron', name: 'Saffron', group: 'Spicy', description: 'Leathery, honeyed and metallic.' },
  { handle: 'black-pepper', name: 'Black pepper', group: 'Spicy', description: 'Dry, sharp and woody spice.' },
  { handle: 'cinnamon', name: 'Cinnamon', group: 'Spicy', description: 'Warm, sweet bark.' },

  // Musky
  { handle: 'white-musk', name: 'White musk', group: 'Musky', description: 'Clean skin, freshly washed cotton.' },
  { handle: 'ambrette', name: 'Ambrette', group: 'Musky', description: 'Plant-based musk, softly fruity and skin-like.' },
  { handle: 'suede', name: 'Suede', group: 'Musky', description: 'Soft, brushed leather.' },
];
