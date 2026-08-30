/* =========================================================
   Demo data source for the Club Elite 21 dashboard.
   Everything the UI renders comes from this single object,
   so swapping in a real API later only touches this file.
   ========================================================= */
window.DB = (function () {
  /* --- Orders: the mall's own orders, with everything the details page shows --- */
  const ORDER_ITEMS = {
    'Mixing Bowls': ['SKU-1029', 25, '\u{1F963}'],
    'Travel Backpack': ['SKU-1035', 70, '\u{1F392}'],
    'LED Table': ['SKU-1031', 35, '\u{1F4A1}'],
    'Gym Dumbbells': ['SKU-1008', 18, '\u{1F3CB}'],
    'Small Sling Bag': ['SKU-1024', 10, '\u{1F45D}'],
    'LED Table Lamp': ['SKU-1005', 16, '\u{1F526}'],
    'Foot Massager Roller': ['SKU-1026', 18, '\u{1F9B6}'],
    'Essentials womens Fleece': ['SKU-1012', 14.39, '\u{1F9E5}'],
    'Nail Clipper Set': ['SKU-1017', 4, '\u{2702}'],
    'Portable Projector': ['SKU-1034', 60, '\u{1F4FD}'],
    'Wireless Headphones': ['SKU-1001', 45, '\u{1F3A7}'],
    'Smart Watch': ['SKU-1002', 85, '\u{231A}'],
    'Bluetooth Speaker': ['SKU-1036', 70, '\u{1F50A}'],
    'Women Handbag': ['SKU-1004', 152, '\u{1F45C}'],
    'Running Shoes': ['SKU-1009', 175, '\u{1F45F}'],
    'Wall Clock': ['SKU-1006', 18, '\u{1F551}']
  };

  const CUSTOMER_CODES = {
    sultan: '965874',
    Malik07: '614332',
    jutt: '702118',
    'Neha sharma': '338920',
    'mahi.018': '451077',
    vj: '289143',
    'Sahil malik': '917655',
    'Anil kumar Srivastava': '560284'
  };

  function makeOrder(id, user, product, qty, status, date, time, ratings) {
    const item = ORDER_ITEMS[product];
    const total = Math.round(item[1] * qty * 100) / 100;
    return {
      id: id,
      /* six character reference, stable for a given order id */
      code: 'ORD-' + ((id * 99991) % 2176782336).toString(36).toUpperCase().slice(0, 6).padStart(6, '0'),
      user: user,
      customerCode: user ? CUSTOMER_CODES[user] || String(100000 + (id * 37) % 899999) : '',
      product: product,
      sku: item[0],
      price: item[1],
      image: item[2],
      qty: qty,
      total: total,
      shipping: 0,
      discount: 0,
      commission: Math.round(total * 0.1 * 100) / 100,
      status: status,
      date: date,
      time: time,
      ratings: ratings || { description: 1, logistics: 1, service: 1 }
    };
  }

  const orders = [
    makeOrder(1041, 'sultan', 'Mixing Bowls', 9, 'Pending', '2026-08-24', '04:03 PM'),
    makeOrder(1040, 'sultan', 'Travel Backpack', 1, 'Completed', '2026-08-24', '03:41 PM', { description: 5, logistics: 4, service: 5 }),
    makeOrder(1039, 'sultan', 'LED Table', 1, 'Completed', '2026-08-24', '02:18 PM', { description: 4, logistics: 4, service: 4 }),
    makeOrder(1038, null, 'Gym Dumbbells', 2, 'Pending', '2026-08-23', '07:55 PM'),
    makeOrder(1037, null, 'Small Sling Bag', 2, 'Pending', '2026-08-23', '06:12 PM'),
    makeOrder(1036, 'Malik07', 'LED Table Lamp', 26, 'Completed', '2026-08-23', '05:30 PM', { description: 5, logistics: 5, service: 4 }),
    makeOrder(1035, 'Malik07', 'Foot Massager Roller', 10, 'Completed', '2026-08-23', '04:47 PM', { description: 4, logistics: 5, service: 5 }),
    makeOrder(1034, 'Malik07', 'Essentials womens Fleece', 34, 'Completed', '2026-08-23', '03:26 PM', { description: 4, logistics: 4, service: 5 }),
    makeOrder(1033, 'Malik07', 'Nail Clipper Set', 42, 'Completed', '2026-08-23', '02:09 PM', { description: 5, logistics: 4, service: 4 }),
    makeOrder(1032, 'Malik07', 'Portable Projector', 9, 'Completed', '2026-08-23', '01:38 PM', { description: 5, logistics: 5, service: 5 })
  ];

  /* the rest of August, so the overview chart has 58 orders behind it */
  (function fillAugust() {
    const buyers = ['sultan', 'Malik07', 'jutt', 'Neha sharma', 'mahi.018', 'vj', 'Sahil malik', 'Anil kumar Srivastava', null];
    const names = Object.keys(ORDER_ITEMS);
    let id = 1031;
    for (let i = 0; i < 48; i++) {
      const product = names[i % names.length];
      const qty = 1 + (i % 12);
      const day = 22 - Math.floor(i / 3);
      const hour = 9 + (i % 9);
      orders.push(
        makeOrder(
          id--,
          buyers[i % buyers.length],
          product,
          qty,
          i === 5 ? 'Pending' : i % 11 === 7 ? 'Cancelled' : 'Completed',
          '2026-08-' + String(day).padStart(2, '0'),
          String(hour).padStart(2, '0') + ':' + String((i * 7) % 60).padStart(2, '0') + (hour < 12 ? ' AM' : ' PM'),
          { description: 3 + (i % 3), logistics: 3 + ((i + 1) % 3), service: 3 + ((i + 2) % 3) }
        )
      );
    }
  })();

  /* --- Withdraw requests, with everything the details page shows --- */
  const withdraws = [
    {
      id: 4,
      user: 'Malik07',
      email: '',
      amount: 500.0,
      method: 'USDT (TRC20)',
      account: 'TX9v...8Kq2',
      wallet: 'WALLET-7C1B44E9A0D3F118',
      status: 'Rejected',
      txStatus: 'Failed',
      flow: 'Out',
      txn: '5f21a7c4-19be-4d02-bb84-6d1c07f4a2e9',
      description: 'Withdrawal Request',
      date: '2026-08-23',
      time: '11:04 AM',
      updatedAt: '2026-08-23 11:26 AM',
      note: 'Wallet address did not match the account holder.'
    },
    {
      id: 3,
      user: 'Neha sharma',
      email: '',
      amount: 1826.0,
      method: 'Bank Transfer',
      account: 'HDFC ****4417',
      wallet: 'WALLET-2A77D5E1B9C04F63',
      status: 'Approved',
      txStatus: 'Completed',
      flow: 'Out',
      txn: 'c8d40b6e-7a51-4f39-9c2d-3b5e18a7460f',
      description: 'Withdrawal Request',
      date: '2026-08-21',
      time: '09:47 AM',
      updatedAt: '2026-08-21 10:15 AM',
      note: ''
    },
    {
      id: 2,
      user: 'jutt',
      email: '',
      amount: 2000.0,
      method: 'USDT (TRC20)',
      account: 'TQ4m...1Zb7',
      wallet: 'WALLET-93B0C7A4E5116D2F',
      status: 'Approved',
      txStatus: 'Completed',
      flow: 'Out',
      txn: 'b1e7f2a9-0c34-4d68-8a15-72d9e4c0b537',
      description: 'Withdrawal Request',
      date: '2026-08-20',
      time: '03:22 PM',
      updatedAt: '2026-08-20 03:58 PM',
      note: ''
    },
    {
      id: 1,
      user: 'Sahil malik',
      email: 'shujjahmalik@gamil.com',
      amount: 1690.0,
      method: 'Bank Transfer',
      account: '009610271835',
      wallet: 'WALLET-0FE531C6038219DC',
      status: 'Approved',
      txStatus: 'Completed',
      flow: 'Out',
      txn: '9320055d-bcc6-44a9-b3ff-7a09826908aa',
      description: 'Withdrawal Request',
      date: '2026-08-16',
      time: '01:12 PM',
      updatedAt: '2026-08-16 01:30 PM',
      note: 'Please mera withdraw dy do bagwna k lyea'
    }
  ];

  /* --- Recharge requests --- */
  const recharges = [
    { id: 8, user: 'Malik07', email: '', amount: 7000.0, method: 'Bank Transfer', txn: '0b4da41c-2f5b-4eaa-9ac2-1bb2a51a95c2',
      status: 'Pending', txStatus: 'Pending', flow: '', description: 'Wallet Recharge',
      date: '2026-08-23', time: '02:28 PM', updatedAt: '', note: '' },
    { id: 7, user: 'Malik07', email: '', amount: 50.0, method: 'USDT (TRC20)', txn: '7b03de55-10ac-4f1e-9d72-5e0b3a6c8412',
      status: 'Completed', txStatus: 'Completed', flow: 'In', description: 'Wallet Recharge',
      date: '2026-08-23', time: '10:11 AM', updatedAt: '2026-08-23 10:35 AM', note: '' },
    { id: 6, user: 'vj', email: '', amount: 100.0, method: 'Bank Transfer', txn: 'c4429ab1-80f6-4a25-b3d1-0c7e9f24a5b8',
      status: 'Pending', txStatus: 'Pending', flow: '', description: 'Wallet Recharge',
      date: '2026-08-20', time: '05:40 PM', updatedAt: '', note: '' },
    { id: 5, user: 'Anil kumar Srivastava', email: '', amount: 6.0, method: 'UPI', txn: '61d0fa9c-3712-4b8e-96af-2d4c15e07b93',
      status: 'Pending', txStatus: 'Pending', flow: '', description: 'Wallet Recharge',
      date: '2026-08-20', time: '02:06 PM', updatedAt: '', note: '' },
    { id: 4, user: 'mahi.018', email: '', amount: 100.0, method: 'UPI', txn: '2e8b7f04-aa19-4c65-8d03-7b1e6a92f4d5',
      status: 'Pending', txStatus: 'Pending', flow: '', description: 'Wallet Recharge',
      date: '2026-08-20', time: '11:52 AM', updatedAt: '', note: '' },
    { id: 3, user: 'Neha sharma', email: '', amount: 250.0, method: 'Bank Transfer', txn: 'ff17c6b9-2035-4e71-a8c4-9d20b7e5314a',
      status: 'Completed', txStatus: 'Completed', flow: 'In', description: 'Wallet Recharge',
      date: '2026-08-19', time: '04:18 PM', updatedAt: '2026-08-19 04:44 PM', note: '' },
    { id: 2, user: 'jutt', email: '', amount: 1200.0, method: 'USDT (TRC20)', txn: '90ac3e17-d54b-4f82-9016-3c7ae2b8d069',
      status: 'Completed', txStatus: 'Completed', flow: 'In', description: 'Wallet Recharge',
      date: '2026-08-18', time: '01:05 PM', updatedAt: '2026-08-18 01:29 PM', note: '' },
    { id: 1, user: 'sultan', email: '', amount: 500.0, method: 'USDT (TRC20)', txn: '3ab6019f-e478-4c53-b2a9-6f81d0c34e27',
      status: 'Completed', txStatus: 'Completed', flow: 'In', description: 'Wallet Recharge',
      date: '2026-08-16', time: '09:33 AM', updatedAt: '2026-08-16 09:51 AM', note: '' }
  ];

  /* --- Catalogue: the 40 products the panel lists, newest first --- */
  const productSeed = [
    ['Curved Gaming Monitor', 'SKU-1020', 250, 'Electronics', '\u{1F5A5}', 906, 5, 1,
     'Curved 32" QHD gaming monitor, 165Hz refresh rate with 1ms response and HDR400.'],
    ['Vanguard, Black', 'SKU-1040', 200, 'Safety', '\u{1F576}', 906, 5, 1,
     'Meta Oakley Vanguard, Black | Smart AI Glasses for Men, Women \u2014 Camera, Audio, Video Recording \u2014 Prizm 24K Black Lenses \u2014 Sunglasses'],
    ['Rolex Submariner', 'SKU-1039', 150, 'Watches', '\u{231A}', 412, 5, 1,
     'Submariner style automatic dive watch, stainless steel case with rotating bezel.'],
    ['Back Massager', 'SKU-1038', 100, 'Health', '\u{1F486}', 288, 4, 0,
     'Shiatsu back and neck massager with heat, eight rotating nodes and a car adapter.'],
    ['Costumes Kit', 'SKU-1037', 80, 'Fashion', '\u{1F3AD}', 132, 4, 0,
     'Twelve piece dress-up costume kit for parties, with accessories and a carry bag.'],
    ['Bluetooth Speaker', 'SKU-1036', 70, 'Electronics', '\u{1F50A}', 654, 5, 1,
     'Portable Bluetooth 5.3 speaker, 24 hour battery, IPX7 waterproof, deep bass.'],
    ['Travel Backpack', 'SKU-1035', 70, 'Bags', '\u{1F392}', 501, 4, 0,
     'Water resistant 35L travel backpack with a padded laptop sleeve and USB port.'],
    ['Portable Projector', 'SKU-1034', 60, 'Electronics', '\u{1F4FD}', 377, 4, 0,
     'Mini 1080p supported projector with built-in speakers, HDMI and screen mirroring.'],
    ['Mini Massage Gun', 'SKU-1033', 50, 'Health', '\u{1F4AA}', 244, 4, 0,
     'Pocket percussion massage gun, four speeds, quiet motor and a six hour battery.'],
    ['Tumbler with Handle', 'SKU-1032', 40, 'Kitchen', '\u{1F964}', 820, 5, 1,
     '40oz stainless steel tumbler with handle, straw lid and all-day ice retention.'],
    ['LED Table', 'SKU-1031', 35, 'Home', '\u{1F4A1}', 165, 4, 0,
     'RGB LED side table with app control, sixteen colours and a rechargeable battery.'],
    ['Handheld Fan', 'SKU-1030', 30, 'Home', '\u{1F32C}', 298, 4, 0,
     'Rechargeable handheld fan, three speeds, folds into a desk stand.'],
    ['Mixing Bowls', 'SKU-1029', 25, 'Kitchen', '\u{1F963}', 743, 5, 0,
     'Stainless steel mixing bowl set of five with lids and non-slip bases.'],
    ['Klein Tools 3005CR', 'SKU-1028', 22, 'Tools', '\u{1F527}', 91, 4, 0,
     'Klein Tools 3005CR conduit fitting and reaming screwdriver, 1/4-Inch.'],
    ['Sleep Headphones', 'SKU-1027', 20, 'Electronics', '\u{1F3A7}', 356, 4, 0,
     'Bluetooth sleep headband with flat speakers, washable and comfortable to lie on.'],
    ['Foot Massager Roller', 'SKU-1026', 18, 'Health', '\u{1F9B6}', 214, 4, 0,
     'Wooden foot massage roller for plantar fasciitis and everyday tired feet.'],
    ['Massage Gun', 'SKU-1025', 15, 'Health', '\u{1F4A2}', 187, 4, 0,
     'Deep tissue massage gun with four heads and a carrying case.'],
    ['Small Sling Bag', 'SKU-1024', 10, 'Bags', '\u{1F45D}', 623, 4, 0,
     'Compact crossbody sling bag with anti-theft pocket, fits a phone and wallet.'],
    ['Bathroom Rugs', 'SKU-1023', 9, 'Home', '\u{1F6C1}', 402, 4, 0,
     'Two piece absorbent bathroom rug set with a non-slip backing, machine washable.'],
    ['Professional Nail Clipper', 'SKU-1022', 8, 'Beauty', '\u{1F485}', 512, 5, 0,
     'Stainless steel professional nail clipper with a catcher and sharp curved blade.'],
    ['Pillowcase', 'SKU-1021', 7, 'Home', '\u{1F6CF}', 288, 4, 0,
     'Satin pillowcase pair for hair and skin, envelope closure, queen size.'],
    ['ROXUN Ski Mask', 'SKU-1019', 6, 'Fashion', '\u{1F3BF}', 143, 4, 0,
     'ROXUN knitted ski mask balaclava, windproof and stretchy, one size.'],
    ['Cleaning Cloth', 'SKU-1018', 5, 'Home', '\u{1F9FD}', 934, 5, 0,
     'Microfibre cleaning cloth pack of ten, lint free and reusable.'],
    ['Nail Clipper Set', 'SKU-1017', 4, 'Beauty', '\u{2702}', 671, 4, 0,
     'Seven piece manicure and pedicure set in a travel case.'],
    ['Cat Clumping Litter', 'SKU-1016', 3, 'Pets', '\u{1F408}', 155, 4, 0,
     'Fast clumping cat litter with odour control, low dust formula.'],
    ['Pretend Play Set', 'SKU-1015', 2, 'Toys', '\u{1F9F8}', 209, 4, 0,
     'Kitchen pretend play set with utensils, food and sounds for ages three and up.'],
    ['Teeth Whitening Pen', 'SKU-1014', 1, 'Beauty', '\u{1F9B7}', 388, 4, 0,
     'Teeth whitening pen with a peroxide gel, enough for thirty treatments.'],
    ['230W Legion 5 Charger', 'SKU-1013', 48.96, 'Electronics', '\u{1F50C}', 77, 5, 0,
     '230W slim tip charger for Lenovo Legion 5 and 5 Pro gaming laptops.'],
    ['Essentials womens Fleece', 'SKU-1012', 14.39, 'Fashion', '\u{1F9E5}', 461, 4, 0,
     'Essentials women\u2019s fleece pullover, soft brushed lining, relaxed fit.'],
    ['T-shirt Hoodie', 'SKU-1011', 13.63, 'Fashion', '\u{1F455}', 528, 4, 0,
     'Lightweight hooded t-shirt in cotton blend, everyday layering piece.'],
    ['Football', 'SKU-1007', 5, 'Sports', '\u{26BD}', 320, 4, 0,
     'Size five match football, machine stitched with a butyl bladder.'],
    ['Gym Dumbbells', 'SKU-1008', 18, 'Fitness', '\u{1F3CB}', 268, 4, 0,
     'Neoprene coated dumbbell pair, non-slip grip, sold as a set.'],
    ['Running Shoes', 'SKU-1009', 175, 'Fashion', '\u{1F45F}', 812, 5, 1,
     'Cushioned road running shoes with a breathable mesh upper and rubber outsole.'],
    ['Hair Dryer', 'SKU-1010', 15, 'Beauty', '\u{1F4A8}', 349, 4, 0,
     'Ionic hair dryer, 1800W with three heat settings and a concentrator nozzle.'],
    ['Wireless Headphones', 'SKU-1001', 45, 'Electronics', '\u{1F3A7}', 1204, 5, 1,
     'Over-ear wireless headphones with active noise cancelling and 40 hour battery.'],
    ['Smart Watch', 'SKU-1002', 85, 'Electronics', '\u{231A}', 977, 5, 1,
     'Fitness smart watch with heart rate, SpO2, GPS and a 1.8" always-on display.'],
    ['Men Casual Shirt', 'SKU-1003', 11, 'Fashion', '\u{1F454}', 232, 4, 0,
     'Men\u2019s casual shirt in breathable cotton, regular fit, button down collar.'],
    ['Women Handbag', 'SKU-1004', 152, 'Bags', '\u{1F45C}', 415, 5, 1,
     'Leather shoulder handbag with a detachable strap and lined interior.'],
    ['LED Table Lamp', 'SKU-1005', 16, 'Home', '\u{1F526}', 190, 4, 0,
     'Dimmable LED table lamp with touch control, USB charging port and timer.'],
    ['Wall Clock', 'SKU-1006', 18, 'Home', '\u{1F551}', 122, 4, 0,
     'Silent sweep wall clock, twelve inch dial with an easy to read face.']
  ];

  const products = productSeed.map(function (row, i) {
    return {
      /* highest id first, so the list shows them in this order */
      id: 1000 + productSeed.length - i,
      name: row[0],
      slug: row[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      sku: row[1],
      price: row[2],
      category: row[3],
      image: row[4],
      imageUrl: '',
      reviews: row[5],
      rating: row[6],
      popular: row[7],
      description: row[8],
      rate: 2,
      status: 'Active'
    };
  });

  /* --- Agents --- */
  const agents = [
    { id: 3, name: 'vj', email: 'bltan00789@hotmail.com', role: 'Agent', referrals: 0, balance: 0, status: 'Active', joined: '2026-08-20' },
    { id: 2, name: 'vj', email: 'altan00789@hotmail.com', role: 'Agent', referrals: 0, balance: 0, status: 'Active', joined: '2026-08-20' },
    { id: 1, name: 'agent', email: 'agent@gmail.com', role: 'Agent', referrals: 6, balance: 0, status: 'Active', joined: '2026-08-14' }
  ];

  const ADMIN_AGENT = { name: 'Admin', email: 'admin@gmail.com' };
  const AGENT_ACC = { name: 'agent', email: 'agent@gmail.com' };

  /* --- Customers: 44 of them, the first six belong to "agent" --- */
  const customerSeed = [
    ['Mirzag', 'mirzag@gmail.com', AGENT_ACC, 0, '2026-08-24'],
    ['Mirza', 'mirza@gmail.com', AGENT_ACC, 0, '2026-08-24'],
    ['Mark01', 'mark01@gmail.com', AGENT_ACC, 0, '2026-08-24'],
    ['000000000', 'zero@gmail.com', ADMIN_AGENT, 0, '2026-08-24'],
    ['sultan', 'sultan@gmail.com', ADMIN_AGENT, 102.1, '2026-08-23'],
    ['Malik07', 'malik07@gmail.com', AGENT_ACC, 7050, '2026-08-23'],
    ['Neha sharma', 'neha.sharma@gmail.com', AGENT_ACC, 1826, '2026-08-21'],
    ['jutt', 'jutt@gmail.com', AGENT_ACC, 2000, '2026-08-20'],
    ['vj', 'vj.mall@gmail.com', AGENT_ACC, 340, '2026-08-20'],
    ['Anil kumar Srivastava', 'anil.srivastava@gmail.com', ADMIN_AGENT, 96, '2026-08-20'],
    ['mahi.018', 'mahi018@gmail.com', ADMIN_AGENT, 412.5, '2026-08-20'],
    ['Sahil malik', 'shujjahmalik@gamil.com', ADMIN_AGENT, 1690, '2026-08-19'],
    ['Rizwan Ahmed', 'rizwan.ahmed@gmail.com', ADMIN_AGENT, 158, '2026-08-19'],
    ['Priya Verma', 'priya.verma@gmail.com', ADMIN_AGENT, 745, '2026-08-18'],
    ['Hamza Iqbal', 'hamza.iqbal@gmail.com', ADMIN_AGENT, 60, '2026-08-18'],
    ['Ayesha Khan', 'ayesha.khan@gmail.com', ADMIN_AGENT, 1290, '2026-08-17'],
    ['Rohit Sharma', 'rohit.sharma@gmail.com', ADMIN_AGENT, 210, '2026-08-17'],
    ['Bilal Hussain', 'bilal.hussain@gmail.com', ADMIN_AGENT, 88, '2026-08-16'],
    ['Sneha Patel', 'sneha.patel@gmail.com', ADMIN_AGENT, 630, '2026-08-16'],
    ['Usman Tariq', 'usman.tariq@gmail.com', ADMIN_AGENT, 1475, '2026-08-15'],
    ['Kavya Nair', 'kavya.nair@gmail.com', ADMIN_AGENT, 305, '2026-08-15'],
    ['Faizan Ali', 'faizan.ali@gmail.com', ADMIN_AGENT, 52, '2026-08-14'],
    ['Ananya Gupta', 'ananya.gupta@gmail.com', ADMIN_AGENT, 980, '2026-08-14'],
    ['Zeeshan Raza', 'zeeshan.raza@gmail.com', ADMIN_AGENT, 143, '2026-08-13'],
    ['Manish Yadav', 'manish.yadav@gmail.com', ADMIN_AGENT, 264, '2026-08-13'],
    ['Sadia Noor', 'sadia.noor@gmail.com', ADMIN_AGENT, 719, '2026-08-12'],
    ['Arjun Mehta', 'arjun.mehta@gmail.com', ADMIN_AGENT, 45, '2026-08-12'],
    ['Hina Aslam', 'hina.aslam@gmail.com', ADMIN_AGENT, 1120, '2026-08-11'],
    ['Deepak Joshi', 'deepak.joshi@gmail.com', ADMIN_AGENT, 375, '2026-08-11'],
    ['Waqar Younis', 'waqar.younis@gmail.com', ADMIN_AGENT, 68, '2026-08-10'],
    ['Ritika Singh', 'ritika.singh@gmail.com', ADMIN_AGENT, 850, '2026-08-10'],
    ['Adnan Sheikh', 'adnan.sheikh@gmail.com', ADMIN_AGENT, 196, '2026-08-09'],
    ['Pooja Rani', 'pooja.rani@gmail.com', ADMIN_AGENT, 522, '2026-08-09'],
    ['Imran Butt', 'imran.butt@gmail.com', ADMIN_AGENT, 134, '2026-08-08'],
    ['Nikhil Rao', 'nikhil.rao@gmail.com', ADMIN_AGENT, 289, '2026-08-08'],
    ['Sana Javed', 'sana.javed@gmail.com', ADMIN_AGENT, 1045, '2026-08-07'],
    ['Vikram Bose', 'vikram.bose@gmail.com', ADMIN_AGENT, 77, '2026-08-07'],
    ['Areeba Fatima', 'areeba.fatima@gmail.com', ADMIN_AGENT, 618, '2026-08-06'],
    ['Suresh Kumar', 'suresh.kumar@gmail.com', ADMIN_AGENT, 231, '2026-08-06'],
    ['Tanya Malhotra', 'tanya.malhotra@gmail.com', ADMIN_AGENT, 494, '2026-08-05'],
    ['Kashif Mehmood', 'kashif.mehmood@gmail.com', ADMIN_AGENT, 39, '2026-08-05'],
    ['Divya Menon', 'divya.menon@gmail.com', ADMIN_AGENT, 806, '2026-08-04'],
    ['Salman Farooq', 'salman.farooq@gmail.com', ADMIN_AGENT, 162, '2026-08-04'],
    ['Harshit Jain', 'harshit.jain@gmail.com', ADMIN_AGENT, 358, '2026-08-03'],
    ['Nadia Saleem', 'nadia.saleem@gmail.com', ADMIN_AGENT, 925, '2026-08-03']
  ];

  /* details the panel shows on a customer's own page */
  const CUSTOMER_EXTRAS = {
    'Sahil malik': {
      username: 'sahilmalik2209',
      phone: '787878787878',
      bank: {
        method: 'Bank Transfer',
        bank: 'ICICI Bank',
        beneficiary: 'Malikkhan',
        account: '009610271835',
        type: 'Fixed_deposit',
        ifsc: 'IPOS0000001',
        branch: '1214'
      }
    },
    Malik07: {
      username: 'malik07',
      code: '78205',
      phone: '7894561233',
      bank: { method: 'Bank Transfer', bank: 'ICICI Bank', beneficiary: '', account: '', type: 'Current', ifsc: '', branch: '' }
    }
  };

  const customers = customerSeed.map(function (row, i) {
    const extra = CUSTOMER_EXTRAS[row[0]] || {};
    return {
      id: 100 + customerSeed.length - i,
      name: row[0],
      email: row[1],
      username: extra.username || row[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
      code: extra.code || '',
      phone: extra.phone || '',
      bank: extra.bank || null,
      role: 'Customer',
      agent: row[2].name,
      agentEmail: row[2].email,
      balance: row[3],
      status: 'Active',
      joined: row[4]
    };
  });

  const users = agents.concat(customers);

  /* --- Soft-deleted users, restorable from the Archived Users screen --- */
  const archived = [
    { id: 501, name: 'Mark 001', email: '', role: 'User', deletedAt: '2026-08-23', status: 'Active' },
    { id: 502, name: 'Ch0', email: '', role: 'User', deletedAt: '2026-08-23', status: 'Active' },
    { id: 503, name: 'Multan', email: '', role: 'User', deletedAt: '2026-08-24', status: 'Active' }
  ];

  /* =======================================================
     Seller side — the Club Elite 21 mobile app
     ======================================================= */

  /* Catalogue the sellers grab their orders from */
  const sellerItems = [
    ['4505 Maternity Icon soft touch high waist yoga legging in black', 31.04, '\u{1F9D8}'],
    ['Nike Air Zoom Pegasus 40 running shoes', 129.9, '\u{1F45F}'],
    ['Apple AirPods Pro (2nd generation)', 249.0, '\u{1F3A7}'],
    ['Dyson Supersonic hair dryer, nickel', 429.0, '\u{1F4A8}'],
    ['Levi\u2019s 501 original fit jeans, stonewash', 89.5, '\u{1F456}'],
    ['Samsung Galaxy Watch6 Classic 47mm', 399.0, '\u{231A}'],
    ['Ray-Ban Wayfarer polarised sunglasses', 175.0, '\u{1F576}'],
    ['Le Creuset signature cast iron casserole 24cm', 320.0, '\u{1F958}'],
    ['Adidas Ultraboost Light, core black', 190.0, '\u{1F45F}'],
    ['Herschel Little America backpack 25L', 110.0, '\u{1F392}'],
    ['Philips 3200 LatteGo espresso machine', 549.0, '\u{2615}'],
    ['Uniqlo Ultra Light Down seamless parka', 79.9, '\u{1F9E5}']
  ];

  const sellers = [
    {
      id: 9001,
      name: 'Pooja sharma',
      email: 'seller@club21mall.com',
      phone: '0000000080',
      role: 'Seller',
      balance: 3245.47,
      rate: 34,
      status: 'Active',
      joined: '2026-07-28',
      inviter: 'agent'
    },
    {
      id: 9002,
      name: 'seller02',
      email: 'seller02@club21mall.com',
      phone: '0000000081',
      role: 'Seller',
      balance: 812.6,
      rate: 25,
      status: 'Active',
      joined: '2026-08-02',
      inviter: 'agent'
    },
    /* seller01's downline — two direct invites and one below them */
    {
      id: 9003,
      name: 'rehan.k',
      email: 'rehan.k@gmail.com',
      phone: '0000000082',
      role: 'Seller',
      balance: 1620.0,
      rate: 30,
      status: 'Active',
      joined: '2026-08-11',
      inviter: 'Pooja sharma'
    },
    {
      id: 9004,
      name: 'ayesha.m',
      email: 'ayesha.m@gmail.com',
      phone: '0000000083',
      role: 'Seller',
      balance: 640.25,
      rate: 25,
      status: 'Active',
      joined: '2026-08-17',
      inviter: 'Pooja sharma'
    },
    {
      id: 9005,
      name: 'tariq.s',
      email: 'tariq.s@gmail.com',
      phone: '0000000084',
      role: 'Seller',
      balance: 305.0,
      rate: 20,
      status: 'Active',
      joined: '2026-08-21',
      inviter: 'rehan.k'
    }
  ];

  /* Grabbed orders. The pending one is the card the app shows first;
     the thirteen completed ones add up to today's 671.79 commission. */
  const sellerOrders = [
    {
      id: 5001,
      sellerId: 9001,
      code: 'UB2608142135235870',
      product: sellerItems[0][0],
      image: sellerItems[0][2],
      price: 31.04,
      qty: 183,
      total: 5680.0,
      commission: 1931.2,
      rate: 34,
      status: 'Pending',
      createdAt: '2026-08-14 21:35:23'
    },
      { id: 5000, sellerId: 9001, code: 'UB260826350020', product: 'Nike Air Zoom Pegasus 40 running shoes', image: '\u{1F45F}',
        price: 129.9, qty: 2, total: 259.8, commission: 31.18, rate: 12, status: 'Completed',
        createdAt: '2026-08-26 08:00:00' },
      { id: 4999, sellerId: 9001, code: 'UB260827091121', product: 'Apple AirPods Pro (2nd generation)', image: '\u{1F3A7}',
        price: 249.0, qty: 1, total: 249.0, commission: 24.9, rate: 10, status: 'Completed',
        createdAt: '2026-08-26 09:07:13' },
      { id: 4998, sellerId: 9001, code: 'UB260827832222', product: 'Dyson Supersonic hair dryer, nickel', image: '\u{1F4A8}',
        price: 429.0, qty: 1, total: 429.0, commission: 34.32, rate: 8, status: 'Completed',
        createdAt: '2026-08-26 10:14:26' },
      { id: 4997, sellerId: 9001, code: 'UB260828573323', product: 'Levi\u2019s 501 original fit jeans, stonewash', image: '\u{1F456}',
        price: 89.5, qty: 3, total: 268.5, commission: 37.59, rate: 14, status: 'Completed',
        createdAt: '2026-08-26 11:21:39' },
      { id: 4996, sellerId: 9001, code: 'UB260829314424', product: 'Samsung Galaxy Watch6 Classic 47mm', image: '\u{231A}',
        price: 399.0, qty: 1, total: 399.0, commission: 35.91, rate: 9, status: 'Completed',
        createdAt: '2026-08-26 12:28:52' },
      { id: 4995, sellerId: 9001, code: 'UB260830055525', product: 'Ray-Ban Wayfarer polarised sunglasses', image: '\u{1F576}',
        price: 175.0, qty: 2, total: 350.0, commission: 42.0, rate: 12, status: 'Completed',
        createdAt: '2026-08-26 13:35:05' },
      { id: 4994, sellerId: 9001, code: 'UB260830796626', product: 'Le Creuset signature cast iron casserole 24cm', image: '\u{1F958}',
        price: 320.0, qty: 1, total: 320.0, commission: 32.0, rate: 10, status: 'Completed',
        createdAt: '2026-08-26 14:42:18' },
      { id: 4993, sellerId: 9001, code: 'UB260831537727', product: 'Adidas Ultraboost Light, core black', image: '\u{1F45F}',
        price: 190.0, qty: 2, total: 380.0, commission: 41.8, rate: 11, status: 'Completed',
        createdAt: '2026-08-26 15:49:31' },
      { id: 4992, sellerId: 9001, code: 'UB260832278828', product: 'Herschel Little America backpack 25L', image: '\u{1F392}',
        price: 110.0, qty: 3, total: 330.0, commission: 42.9, rate: 13, status: 'Completed',
        createdAt: '2026-08-26 16:56:44' },
      { id: 4991, sellerId: 9001, code: 'UB260833019929', product: 'Philips 3200 LatteGo espresso machine', image: '\u{2615}',
        price: 549.0, qty: 1, total: 549.0, commission: 43.92, rate: 8, status: 'Completed',
        createdAt: '2026-08-26 17:03:57' },
      { id: 4990, sellerId: 9001, code: 'UB260833761030', product: 'Uniqlo Ultra Light Down seamless parka', image: '\u{1F9E5}',
        price: 79.9, qty: 4, total: 319.6, commission: 47.94, rate: 15, status: 'Completed',
        createdAt: '2026-08-26 18:10:10' },
      { id: 4989, sellerId: 9001, code: 'UB260834502131', product: 'Nike Air Zoom Pegasus 40 running shoes', image: '\u{1F45F}',
        price: 129.9, qty: 1, total: 129.9, commission: 15.59, rate: 12, status: 'Completed',
        createdAt: '2026-08-26 19:17:23' },
      { id: 4988, sellerId: 9001, code: 'UB260835243232', product: 'Ray-Ban Wayfarer polarised sunglasses', image: '\u{1F576}',
        price: 175.0, qty: 1, total: 175.0, commission: 241.74, rate: 138.14, status: 'Completed',
        createdAt: '2026-08-26 08:24:36' }
  ];

  /* Downline activity — what the team screen totals up */
  (function downline() {
    const members = [
      [9003, 'rehan.k', 30, 4],
      [9004, 'ayesha.m', 25, 3],
      [9005, 'tariq.s', 20, 2]
    ];
    let id = 4800;
    members.forEach(function (m) {
      for (let i = 0; i < m[3]; i++) {
        const item = sellerItems[(i + m[0]) % sellerItems.length];
        const qty = 1 + (i % 3);
        const total = Math.round(item[1] * qty * 100) / 100;
        sellerOrders.push({
          id: id--,
          sellerId: m[0],
          code: 'UB2608' + String(400000 + m[0] * 7 + i * 331) + String(30 + i),
          product: item[0],
          image: item[2],
          price: item[1],
          qty: qty,
          total: total,
          commission: Math.round(total * m[2]) / 100,
          rate: m[2],
          status: 'Completed',
          createdAt: '2026-08-2' + (2 + (i % 4)) + ' 1' + (i % 8) + ':30:00'
        });
      }
    });
  })();

  /* Masked payout ticker on the seller home screen */
  const withdrawFeed = [
    { id: 1, account: '948***8163', amount: 743290, date: '2026-08-26' },
    { id: 2, account: '965***1092', amount: 172116, date: '2026-08-26' },
    { id: 3, account: '394***6039', amount: 240625, date: '2026-08-26' },
    { id: 4, account: '791***4756', amount: 419278, date: '2026-08-26' },
    { id: 5, account: '849***9488', amount: 516927, date: '2026-08-26' }
  ];

  const partners = [
    { name: 'carousell', color: '#ff5a5f', style: 'plain' },
    { name: 'redmart', color: '#ffffff', bg: '#e8262d', style: 'solid' },
    { name: 'OTTO', color: '#e2001a', style: 'plain' },
    { name: 'REEBONZ', color: '#ffffff', bg: '#111111', style: 'solid' },
    { name: 'AUCTIGON', color: '#e8e2d2', bg: '#2b2b2b', style: 'solid' },
    { name: 'Shopee', color: '#ee4d2d', style: 'plain' },
    { name: 'STYLE NANDA', color: '#ffffff', bg: '#111111', style: 'solid' },
    { name: 'Gmarket', color: '#2b7a2b', style: 'plain' },
    { name: 'HipVan', color: '#12b5b0', style: 'plain' }
  ];

  /* VIP tiers — the balance a seller holds decides the commission rate
     they earn and how many orders they may take in a day. */
  const vipLevels = [
    { id: 1, name: 'VIP1', minBalance: 50, rate: 20, dailyOrders: 10, color: '#9aa4b2' },
    { id: 2, name: 'VIP2', minBalance: 500, rate: 25, dailyOrders: 20, color: '#4c9be8' },
    { id: 3, name: 'VIP3', minBalance: 1500, rate: 30, dailyOrders: 30, color: '#16b3ae' },
    { id: 4, name: 'VIP4', minBalance: 3000, rate: 34, dailyOrders: 40, color: '#b07d12' },
    { id: 5, name: 'VIP5', minBalance: 10000, rate: 40, dailyOrders: 60, color: '#7b4bd8' }
  ];

  const rechargePresets = [100, 200, 500, 1000, 2000, 3000, 5000, 8000];

  const db = {
    admin: { name: 'admin', email: 'admin@club21mall.com', role: 'Administrator' },

    orders: orders,
    withdraws: withdraws,
    recharges: recharges,
    products: products,
    users: users,
    archived: archived,

    /* seller app */
    sellers: sellers,
    sellerOrders: sellerOrders,
    sellerItems: sellerItems,
    withdrawFeed: withdrawFeed,
    partners: partners,
    rechargePresets: rechargePresets,
    /* what the guest landing page shows before anyone signs in */
    landing: {
      headline: 'MAKE YOUR HOUSE A HOME',
      sub: 'With This Inspiring Home Decor Collection',
      offer: 'FROM 20% OFF',
      products: [
        { name: 'Apple - iPhone 15 128GB', price: 799, image: '\u{1F4F1}' },
        { name: 'QCY H3 ANC Wireless Headphones Bluetooth', price: 45, image: '\u{1F3A7}' },
        { name: 'Heavy duty commercial multifunctional blender', price: 129, image: '\u{1F964}' },
        { name: 'Folding recliner lounge chair with cushion', price: 89, image: '\u{1FA91}' },
        { name: 'Curved Gaming Monitor 32\u2033 QHD 165Hz', price: 250, image: '\u{1F5A5}' },
        { name: 'Rolex Submariner automatic dive watch', price: 150, image: '\u{231A}' }
      ]
    },

    seller: {
      appName: 'Club Elite 21',
      /* the support card on the MALL screen */
      service: { title: 'Online Customer Service', hours: '10:00-22:00', badge: 'MAS | MONETARY AUTHORITY OF SINGAPORE' },
      /* the small print under the recharge methods */
      rechargeNotes: [
        'The payment amount must be exactly the same as the order, otherwise it will not arrive.',
        'Use the address shown on the payment page for this order only \u2014 addresses change between orders.',
        'Funds are credited once an administrator confirms the transfer, usually within ten minutes.'
      ],
      banks: ['ICICI', 'HDFC', 'SBI', 'Axis Bank', 'Kotak', 'UBL', 'Meezan Bank'],
      withdrawMethods: ['USDT (TRC20)', 'USDT (ERC20)', 'Bank Transfer'],
      paymentMethod: { label: 'USDT', min: 50, max: 1000000 },
      /* team commission paid to the inviter on their members' earnings */
      teamRates: { level1: 8, level2: 3, level3: 1 },
      /* an order freezes when its value runs past the balance, and a
         pending order left this long freezes as well */
      freezing: { staleHours: 24, premiumEvery: 5, premiumMultiplier: 1.6 }
    },
    vipLevels: vipLevels,

    stats: { totalAgents: 0, totalCustomers: 0, pendingCustomers: 0, totalRevenue: 26508.43 },

    /* Orders per month for the overview chart */
    ordersOverview: {
      labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      values: [0, 0, 0, 0, 0, 58]
    },

    pendingOrders: 0,
    pendingRecharges: 0
  };

  /* ---------------------------------------------------------
     Persistence — demo edits survive a reload. Everything is
     kept in localStorage under one key; clearing it restores
     the seed data above.
     --------------------------------------------------------- */
  /* bumped when the seed shape changes so stale demo data is discarded */
  const STORE_KEY = 'club21-data-v2';
  const COLLECTIONS = ['orders', 'withdraws', 'recharges', 'products', 'users', 'archived'];

  db.recompute = function () {
    db.stats.totalAgents = db.users.filter(function (u) { return u.role === 'Agent'; }).length;
    db.stats.totalCustomers = db.users.filter(function (u) { return u.role === 'Customer'; }).length;
    db.stats.pendingCustomers = db.users.filter(function (u) { return u.status === 'Pending'; }).length;
    db.pendingOrders = db.orders.filter(function (o) { return o.status === 'Pending'; }).length;
    db.pendingRecharges = db.recharges.filter(function (r) { return r.status === 'Pending'; }).length;
  };

  db.persist = function () {
    db.recompute();
    try {
      const snapshot = {};
      COLLECTIONS.forEach(function (k) { snapshot[k] = db[k]; });
      localStorage.setItem(STORE_KEY, JSON.stringify(snapshot));
    } catch (e) {}
  };

  db.reset = function () {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
  };

  /** Next free id for a collection, used when adding records. */
  db.nextId = function (name) {
    return db[name].reduce(function (max, r) { return Math.max(max, Number(r.id) || 0); }, 0) + 1;
  };

  (function restore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        COLLECTIONS.forEach(function (k) {
          if (Array.isArray(saved[k])) db[k] = saved[k];
        });
      }
    } catch (e) {}
    db.recompute();
  })();

  return db;
})();
