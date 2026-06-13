// Vercel Serverless Function — /api/products
// Returns the product catalogue as JSON
// Future: could pull from a CMS or Vercel KV

const PRODUCTS = [
  { id:'p1',  name:'2025/26 Home Kit Jersey',   category:['kits'],             price:550, oldPrice:null, badge:'new',  soldOut:false, sizes:['XS','S','M','L','XL','XXL'] },
  { id:'p2',  name:'2025/26 Away Kit Jersey',   category:['kits'],             price:550, oldPrice:null, badge:'new',  soldOut:false, sizes:['XS','S','M','L','XL','XXL'] },
  { id:'p3',  name:'2025/26 GK Jersey',         category:['kits'],             price:499, oldPrice:null, badge:null,   soldOut:false, sizes:['S','M','L','XL','XXL'] },
  { id:'p4',  name:'2025/26 Home Kit — Kids',   category:['kits','kids'],      price:380, oldPrice:null, badge:null,   soldOut:false, sizes:['4–6','6–8','8–10','10–12','12–14'] },
  { id:'p5',  name:'2025/26 Home Kit — Ladies', category:['kits','ladies'],    price:520, oldPrice:null, badge:null,   soldOut:false, sizes:['XS','S','M','L','XL'] },
  { id:'p6',  name:'Training Tracksuit',        category:['training'],         price:699, oldPrice:850,  badge:'sale', soldOut:false, sizes:['S','M','L','XL','XXL'] },
  { id:'p7',  name:'Training T-Shirt',          category:['training'],         price:280, oldPrice:null, badge:null,   soldOut:false, sizes:['XS','S','M','L','XL','XXL'] },
  { id:'p8',  name:'Supporters Scarf',          category:['accessories'],      price:150, oldPrice:null, badge:null,   soldOut:false, sizes:['One Size'] },
  { id:'p9',  name:'Snapback Cap',              category:['accessories'],      price:220, oldPrice:null, badge:null,   soldOut:false, sizes:['One Size'] },
  { id:'p10', name:'Supporters Polo',           category:['training'],         price:320, oldPrice:null, badge:null,   soldOut:false, sizes:['S','M','L','XL','XXL'] },
  { id:'p11', name:'Away Kit Junior',           category:['kits','kids'],      price:380, oldPrice:null, badge:null,   soldOut:true,  sizes:['4–6','6–8','8–10','10–12','12–14'] },
  { id:'p12', name:'Gym Bag',                   category:['accessories'],      price:390, oldPrice:null, badge:null,   soldOut:false, sizes:['One Size'] },
];

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { category, id } = req.query || {};
  let list = PRODUCTS;
  if (id) {
    const product = list.find(p => p.id === id);
    return product
      ? res.status(200).json(product)
      : res.status(404).json({ error: 'Product not found' });
  }
  if (category && category !== 'all') {
    list = list.filter(p => p.category.includes(category));
  }
  return res.status(200).json({ products: list, total: list.length });
};
