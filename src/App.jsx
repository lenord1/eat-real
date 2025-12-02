import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, MapPin, Filter, Star, AlertTriangle, User, Heart, Users, 
  Utensils, Lock, PlayCircle, X, Tv, Crown, CreditCard, LocateFixed, 
  ExternalLink, Loader2, ArrowRight, SlidersHorizontal, CheckCircle, Dog, 
  ChevronDown, Map as MapIcon, Calendar
} from 'lucide-react';

// --- 設定檔 ---
const GOOGLE_API_KEY = ""; 
const USE_REAL_API = false; 

// --- 1. 定義用餐情境 (快速選擇) ---
const DINING_TYPES = [
  { id: 'solo', name: "單人獨享", icon: <User size={24} />, desc: "自在不尷尬", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200", hover: "hover:bg-blue-100" },
  { id: 'date', name: "兩人約會", icon: <Heart size={24} />, desc: "氣氛好", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200", hover: "hover:bg-rose-100" },
  { id: 'group', name: "多人聚餐", icon: <Users size={24} />, desc: "好聊好吵", color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-200", hover: "hover:bg-violet-100" },
];

// --- 2. 詳細分類 (16種) ---
const CATEGORIES = [
  { name: "全部", icon: "🍽️" }, { name: "火鍋", icon: "🍲" }, { name: "燒肉", icon: "🔥" }, { name: "拉麵", icon: "🍜" },
  { name: "壽司", icon: "🍣" }, { name: "牛排", icon: "🥩" }, { name: "早午餐", icon: "🍳" }, { name: "咖啡廳", icon: "☕" },
  { name: "居酒屋", icon: "🏮" }, { name: "韓式", icon: "🥘" }, { name: "泰式", icon: "🥥" }, { name: "義式", icon: "🍝" }, 
  { name: "漢堡", icon: "🍔" }, { name: "甜點", icon: "🍧" }, { name: "素食", icon: "🥗" }, { name: "小吃", icon: "🥢" }
];

// --- 服務層：Google Maps Service ---
const GoogleMapsService = {
  geocode: async (address) => {
    await new Promise(r => setTimeout(r, 600));
    if (address.includes('板橋')) return { lat: 25.014, lng: 121.464, formattedAddress: "新北市板橋區" };
    if (address.includes('信義')) return { lat: 25.034, lng: 121.564, formattedAddress: "台北市信義區" };
    return { lat: 25.037, lng: 121.565, formattedAddress: "台北市信義區 (預設)" };
  },
  searchNearby: async (lat, lng, keyword, category) => {
    try {
  // 修改後的正確程式碼
const response = await fetch('https://eat-real-backend-2.onrender.com/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, keyword: keyword || (category === "全部" ? "" : category) })
      });
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results.map(place => ({
          id: place.place_id || place.id,
          name: place.displayName?.text || place.name,
          lat: place.location?.latitude || lat,
          lng: place.location?.longitude || lng,
          rating: place.rating || 0,
          reviews: place.userRatingCount || 0,
          shortFiveStarReviews: Math.floor((place.userRatingCount || 0) * 0.12),
          category: "餐廳", price: "$$", tags: [], isSolo: true, isPet: false, image: "🍽️",
          address: place.formattedAddress || "地址載入中...",
          googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
        }));
      }
      return GoogleMapsService.mockSearch(lat, lng, keyword, category);
    } catch (e) {
      return GoogleMapsService.mockSearch(lat, lng, keyword, category);
    }
  },
  mockSearch: async (lat, lng, keyword, category) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const searchKey = keyword || (category === "全部" ? "" : category);
    const realWorldRestaurants = [
      { name: "馬辣頂級麻辣鴛鴦火鍋", cat: "火鍋", img: "🍲", price: "$$$", rating: 4.6, reviews: 8000 },
      { name: "詹記麻辣火鍋", cat: "火鍋", img: "🍲", price: "$$$", rating: 4.7, reviews: 6000 },
      { name: "屋馬燒肉", cat: "燒肉", img: "🔥", price: "$$$", rating: 4.8, reviews: 9500 },
      { name: "乾杯燒肉居酒屋", cat: "燒肉", img: "🔥", price: "$$$", rating: 4.5, reviews: 3000 },
      { name: "一蘭拉麵", cat: "拉麵", img: "🍜", price: "$$$", rating: 4.8, reviews: 9000 },
      { name: "藏壽司", cat: "壽司", img: "🍣", price: "$$", rating: 4.3, reviews: 2500 },
      { name: "鼎泰豐", cat: "小吃", img: "🥢", price: "$$$", rating: 4.5, reviews: 5200 },
      { name: "路易莎咖啡", cat: "咖啡廳", img: "☕", price: "$", rating: 3.9, reviews: 800 },
      { name: "麥當勞", cat: "漢堡", img: "🍔", price: "$", rating: 4.1, reviews: 6000 },
      { name: "王品牛排", cat: "牛排", img: "🥩", price: "$$$$", rating: 4.7, reviews: 5000 },
      { name: "瓦城泰國料理", cat: "泰式", img: "🥥", price: "$$$", rating: 4.5, reviews: 3500 },
      { name: "Cold Stone 酷聖石", cat: "甜點", img: "🍧", price: "$$", rating: 4.2, reviews: 1200 },
      { name: "金色三麥", cat: "居酒屋", img: "🏮", price: "$$$", rating: 4.4, reviews: 4500 },
      { name: "涓豆腐", cat: "韓式", img: "🥘", price: "$$", rating: 4.3, reviews: 3200 },
      { name: "果然匯", cat: "素食", img: "🥗", price: "$$$", rating: 4.5, reviews: 2800 }
    ];
    
    let filteredPool = realWorldRestaurants;
    if (searchKey && searchKey !== "全部") {
        filteredPool = realWorldRestaurants.filter(r => r.cat.includes(searchKey) || r.name.includes(searchKey));
        if (filteredPool.length < 3) filteredPool = [...filteredPool, ...realWorldRestaurants.slice(0, 5)];
    }

    const results = [];
    for (let i = 0; i < 15; i++) {
      const template = filteredPool[i % filteredPool.length];
      const isWash = template.rating > 4.5 && Math.random() > 0.6;
      const branches = ["信義店", "中山店", "板橋店", "旗艦店"];
      results.push({
        id: `place_${i}_${Date.now()}`,
        name: `${template.name} ${branches[Math.floor(Math.random() * branches.length)]}`,
        category: template.cat, price: template.price, rating: template.rating, reviews: template.reviews,
        shortFiveStarReviews: isWash ? Math.floor(template.reviews * (0.2 + Math.random() * 0.3)) : Math.floor(template.reviews * 0.02),
        lat: lat + (Math.random() - 0.5) * 0.008, lng: lng + (Math.random() - 0.5) * 0.008,
        tags: ["單人", "聚餐"], isSolo: true, isPet: Math.random() > 0.8, image: template.img,
        address: `台北市某某路${Math.floor(Math.random()*200)+1}號`,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(template.name)}`
      });
    }
    return results;
  }
};

// --- UI Components ---

const StarRating = ({ rating }) => (
  <div className="flex items-center bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md shadow-sm">
    <Star size={14} className="text-amber-500 fill-amber-500" />
    <span className="ml-1.5 text-sm font-bold text-amber-700 font-mono">{rating}</span>
  </div>
);

const LocationModal = ({ isOpen, onClose, onSetLocation }) => {
  const [address, setAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  if (!isOpen) return null;
  const handleGPS = () => {
    setIsProcessing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setIsProcessing(false); onSetLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }, "我的位置"); onClose(); },
      (err) => { setIsProcessing(false); alert("定位失敗"); }, { enableHighAccuracy: true }
    );
  };
  const handleAddressSubmit = async () => {
    if (!address.trim()) return;
    setIsProcessing(true);
    try {
      const result = await GoogleMapsService.geocode(address);
      setIsProcessing(false); onSetLocation(result, result.formattedAddress); onClose();
    } catch (e) { setIsProcessing(false); alert("找不到該地址"); }
  };
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative p-6 space-y-6 animate-in zoom-in-95 duration-200 border border-white/20">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
        <div className="text-center">
          <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3 text-teal-600"><MapPin size={24} /></div>
          <h2 className="text-xl font-bold text-slate-800">設定所在位置</h2>
          <p className="text-xs text-slate-400 mt-1">尋找您附近的真實美味</p>
        </div>
        <button onClick={handleGPS} disabled={isProcessing} className="w-full py-3.5 rounded-2xl bg-teal-500 text-white font-bold hover:bg-teal-600 active:scale-95 transition shadow-md shadow-teal-200 flex items-center justify-center gap-2">
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />} 使用 GPS 定位
        </button>
        <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink-0 mx-4 text-slate-300 text-xs">或自行輸入地址</span><div className="flex-grow border-t border-slate-100"></div></div>
        <div className="flex gap-2">
          <input type="text" placeholder="例如：台北市信義區..." className="flex-1 bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 transition placeholder:text-slate-300" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddressSubmit()}/>
          <button onClick={handleAddressSubmit} className="bg-slate-800 text-white p-3 rounded-xl hover:bg-slate-700 active:scale-95 transition shadow-lg"><ArrowRight size={20} /></button>
        </div>
      </div>
    </div>
  );
};

// 綠界金流 & 廣告解鎖視窗
const PremiumModal = ({ isOpen, onClose, onUnlockTemp, onSubscribe }) => {
  const [step, setStep] = useState('select'); 
  const [adTimeLeft, setAdTimeLeft] = useState(null);
  const [plan, setPlan] = useState('monthly'); // monthly or yearly

  useEffect(() => {
    if (adTimeLeft === null) return;
    if (adTimeLeft > 0) {
      const timer = setTimeout(() => setAdTimeLeft(adTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onUnlockTemp();
      onClose();
      setAdTimeLeft(null);
    }
  }, [adTimeLeft, onUnlockTemp, onClose]);

  const handlePay = async (selectedPlan) => { 
    setStep('processing'); 
    
    // 呼叫後端建立綠界訂單 (模擬)
    try {
        const amount = selectedPlan === 'monthly' ? 70 : 672; // 70*12*0.8 = 672
        const planName = selectedPlan === 'monthly' ? "食真 Pro 月訂閱" : "食真 Pro 年訂閱 (8折)";

        // 真實環境請解除以下註解並呼叫後端
        /*
        const response = await fetch('http://localhost:3000/api/payment/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planName, amount })
        });
        const data = await response.json();
        // 在這裡應該要建立一個 form 並自動 submit 到綠界
        */
       
        // 模擬成功
        setTimeout(() => { 
            onSubscribe(); 
            onClose(); 
            setStep('select'); 
            alert(`🎉 訂閱成功！\n您已選擇 ${planName}，金額 NT$${amount}。`); 
        }, 2000);

    } catch(e) {
        alert("付款失敗");
        setStep('select');
    }
  };
  
  if (!isOpen) return null;

  // 廣告畫面
  if (adTimeLeft !== null) {
    return (
      <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-900 w-full max-w-md aspect-video rounded-2xl flex flex-col items-center justify-center relative border border-gray-700 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center text-white space-y-4">
            <Tv size={48} className="text-yellow-400 animate-pulse" />
            <h3 className="text-2xl font-bold">超級美味炸雞</h3>
            <p className="text-gray-300 font-mono">廣告剩餘 {adTimeLeft} 秒...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative border border-white/50">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors z-10"><X size={20} /></button>
        
        {step === 'processing' ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center"><CreditCard size={24} className="text-teal-600"/></div>
            </div>
            <div className="text-center">
                <p className="font-bold text-slate-800 text-lg">正在連接綠界金流...</p>
                <p className="text-slate-400 text-xs mt-1">安全加密連線中</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 text-teal-600 transform rotate-3"><Lock size={28} /></div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">解鎖進階偵測</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">訂閱即可無限次查看真實評論分析<br/>或觀看廣告單次解鎖</p>
            </div>
            
            <div className="p-6 space-y-3 bg-white">
              {/* 月訂閱 */}
              <div 
                className={`border-2 p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all ${plan === 'monthly' ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-slate-200 hover:border-teal-300'}`}
                onClick={() => setPlan('monthly')}
              >
                <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${plan === 'monthly' ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}>
                        {plan === 'monthly' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">月訂閱</h3>
                        <p className="text-xs text-slate-500">隨時可取消</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-lg font-bold text-teal-700">NT$ 70</span>
                    <span className="text-[10px] text-teal-500 uppercase">/ Month</span>
                </div>
              </div>

              {/* 年訂閱 */}
              <div 
                className={`relative border-2 p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all overflow-hidden ${plan === 'yearly' ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-slate-200 hover:border-amber-300'}`}
                onClick={() => setPlan('yearly')}
              >
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">🔥 80% OFF</div>
                <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${plan === 'yearly' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
                        {plan === 'yearly' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">年訂閱</h3>
                        <p className="text-xs text-amber-600 font-bold">激省方案！</p>
                    </div>
                </div>
                <div className="text-right mt-1">
                    <span className="block text-lg font-bold text-amber-700">NT$ 672</span>
                    <span className="text-[10px] text-amber-600 uppercase line-through opacity-60">NT$ 840</span>
                </div>
              </div>

              {/* 訂閱按鈕 */}
              <button 
                onClick={() => handlePay(plan)}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition active:scale-95 flex items-center justify-center gap-2 mt-2 ${plan === 'yearly' ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-orange-200' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'}`}
              >
                {plan === 'yearly' ? <Crown size={18} /> : <CreditCard size={18} />}
                {plan === 'yearly' ? '升級年繳會員 (省很大)' : '開啟月訂閱'}
              </button>

              {/* 廣告選項 */}
              <div className="relative py-2 flex items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink-0 mx-3 text-slate-300 text-xs">OR</span>
                  <div className="flex-grow border-t border-slate-100"></div>
              </div>
              
              <button 
                onClick={() => setAdTimeLeft(5)}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition text-sm flex items-center justify-center gap-2"
              >
                <PlayCircle size={16} /> 看廣告單次解鎖
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- 主程式 ---
export default function EatRealApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedDiningType, setSelectedDiningType] = useState(null);
  const [spamThreshold, setSpamThreshold] = useState(0.15); 
  const [filters, setFilters] = useState({ pet: false, price: "all" });
  
  const [currentLocation, setCurrentLocation] = useState({ lat: 25.037, lng: 121.565 });
  const [locationName, setLocationName] = useState(""); 
  const [isSearching, setIsSearching] = useState(false); 
  const [restaurants, setRestaurants] = useState([]);
  
  const [isProMember, setIsProMember] = useState(false); 
  const [isFeatureUnlocked, setIsFeatureUnlocked] = useState(false); 
  const [showPremiumModal, setShowPremiumModal] = useState(false); 
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Pro 會員預設全解鎖，且滑桿可以自由調整 (不會被鎖定)
  useEffect(() => { if (isProMember) setIsFeatureUnlocked(true); }, [isProMember]);

  useEffect(() => {
    let isMounted = true;
    const performSearch = async () => {
      setIsSearching(true);
      try {
        const results = await GoogleMapsService.searchNearby(currentLocation.lat, currentLocation.lng, searchTerm, selectedCategory);
        if (isMounted) { setRestaurants(results); setIsSearching(false); }
      } catch (error) { if (isMounted) setIsSearching(false); }
    };
    const timeoutId = setTimeout(() => { performSearch(); }, 500);
    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, [currentLocation, selectedCategory, searchTerm]);

  const processedRestaurants = useMemo(() => {
    return restaurants.map(resto => {
      const washRatio = resto.reviews > 0 ? (resto.shortFiveStarReviews / resto.reviews) : 0;
      const isSpam = washRatio > spamThreshold;
      return { ...resto, washRatio, isSpam };
    }).filter(resto => {
      let matchType = true;
      if (selectedDiningType === 'solo') matchType = resto.isSolo || resto.tags.includes("單人");
      else if (selectedDiningType === 'date') matchType = resto.tags.includes("約會") || resto.price === "$$$";
      else if (selectedDiningType === 'group') matchType = resto.tags.includes("聚餐");
      
      const matchPet = filters.pet ? resto.isPet : true;
      const matchPrice = filters.price === "all" || resto.price === filters.price;
      return matchType && matchPet && matchPrice;
    });
  }, [restaurants, selectedDiningType, spamThreshold, filters]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden">
      <LocationModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} onSetLocation={(coords, name) => { setCurrentLocation(coords); setLocationName(name); }} />
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} onUnlockTemp={() => setIsFeatureUnlocked(true)} onSubscribe={() => setIsProMember(true)} />

      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm z-20 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2.5 rounded-2xl text-white shadow-lg shadow-teal-200"><Utensils size={24} strokeWidth={2.5} /></div>
          <div>
             <h1 className="text-xl font-extrabold tracking-tight text-slate-800">食真 EatReal</h1>
             <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Real Reviews Only</p>
          </div>
          {isProMember && <span className="ml-2 bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm flex items-center gap-1 border border-amber-200"><Crown size={12} strokeWidth={3} /> PRO</span>}
        </div>
        <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition border border-slate-200 max-w-[160px] group">
          <LocateFixed size={16} className="flex-shrink-0 text-teal-500 group-hover:scale-110 transition-transform" />
          <span className="truncate">{locationName || "設定位置"}</span>
        </button>
      </header>

      {/* Controls Section */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm z-10 border-b border-slate-200 pt-4 pb-6 px-6 space-y-6 overflow-y-auto" style={{maxHeight: '60vh'}}>
        
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute left-5 top-4 text-slate-400 group-focus-within:text-teal-500 transition-colors"><Search size={20}/></div>
          <input 
            type="text" 
            placeholder="搜尋餐廳、種類或關鍵字..." 
            className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-0 focus:border-teal-500 focus:bg-white transition-all text-sm shadow-inner outline-none placeholder:text-slate-400"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          {isSearching && <div className="absolute right-5 top-4 text-teal-500 animate-spin"><Loader2 size={20}/></div>}
        </div>

        {/* 1. 用餐情境快速選擇 (Cards) */}
        <div className="grid grid-cols-3 gap-4">
          {DINING_TYPES.map((type) => {
            const isSelected = selectedDiningType === type.id;
            return (
              <button 
                key={type.id} 
                onClick={() => setSelectedDiningType(isSelected ? null : type.id)} 
                className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 h-24 flex flex-col items-center justify-center gap-2 shadow-sm hover:-translate-y-1
                  ${isSelected ? `border-${type.color.split('-')[1]}-500 bg-${type.color.split('-')[1]}-50 ring-2 ring-${type.color.split('-')[1]}-200 ring-offset-1` : `border-slate-100 bg-white hover:border-${type.color.split('-')[1]}-200`}`}
              >
                <div className={`transition-transform duration-300 ${isSelected ? 'scale-110 ' + type.color : 'text-slate-400'}`}>{type.icon}</div>
                <span className={`text-xs font-bold ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>{type.name}</span>
                <div className={`absolute bottom-0 left-0 w-full h-1 ${isSelected ? 'bg-current ' + type.color : 'bg-transparent'}`}></div>
              </button>
            );
          })}
        </div>

        {/* 2. 詳細分類選單 (Grid Layout - 多排排列) */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 aspect-square
                        ${selectedCategory === cat.name 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-200 ring-offset-1' 
                            : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-[10px] font-bold whitespace-nowrap">{cat.name}</span>
                </button>
            ))}
        </div>

        {/* Filters & Slider */}
        <div className="flex flex-wrap gap-4 items-center pt-2">
          {/* 洗評敏感度 (上鎖邏輯) */}
          <div className={`flex-grow px-4 py-3 rounded-2xl border flex flex-col justify-center min-w-[200px] relative overflow-hidden transition-all ${isFeatureUnlocked ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
             
             {/* 鎖定遮罩 */}
             {!isFeatureUnlocked && (
                <div className="absolute inset-0 bg-slate-100/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <button onClick={() => setShowPremiumModal(true)} className="bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-50">
                        <Lock size={12}/> 解鎖調整
                    </button>
                </div>
             )}

             <div className="flex justify-between text-xs text-slate-500 font-bold mb-2">
               <span className="flex items-center gap-1.5"><SlidersHorizontal size={14} className="text-slate-400"/> 洗評敏感度設定</span>
               <span className={`px-2 py-0.5 rounded transition-colors ${isFeatureUnlocked ? 'text-teal-600 bg-teal-100' : 'text-slate-400 bg-slate-200'}`}>{(spamThreshold * 100).toFixed(0)}%</span>
             </div>
             <input 
                type="range" 
                min="0.05" max="0.50" step="0.05" 
                value={spamThreshold} 
                onChange={(e) => setSpamThreshold(parseFloat(e.target.value))} 
                disabled={!isFeatureUnlocked}
                className="w-full h-2 bg-slate-300 rounded-full appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition disabled:cursor-not-allowed disabled:accent-slate-400" 
             />
          </div>
          
          <select 
              className="flex-shrink-0 px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm text-slate-600 font-bold shadow-sm focus:outline-none focus:border-teal-500 transition hover:bg-slate-50 cursor-pointer"
              value={filters.price} 
              onChange={(e) => setFilters({...filters, price: e.target.value})}
            >
              <option value="all">💰 預算不限</option>
              <option value="$">$ 平價</option>
              <option value="$$">$$ 中價</option>
              <option value="$$$">$$$ 高檔</option>
            </select>

            <button 
              onClick={() => setFilters({...filters, pet: !filters.pet})}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-2xl text-sm border-2 transition shadow-sm font-bold active:scale-95 ${filters.pet ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
            >
              <Dog size={18}/> 寵物友善
            </button>
        </div>
      </div>

      {/* Restaurant List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 pb-24 scrollbar-hide">
        <div className="flex justify-between items-end px-1">
            <h2 className="text-lg font-bold text-slate-800">
                {selectedDiningType ? `適合「${DINING_TYPES.find(t => t.id === selectedDiningType)?.name}」` : "附近推薦"}
            </h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-lg">{processedRestaurants.length} 間</span>
        </div>
        
        {processedRestaurants.map(resto => (
            <div key={resto.id} className={`relative p-5 rounded-[24px] border transition-all bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-default group ${isFeatureUnlocked && resto.isSpam ? 'bg-red-50/40 border-red-100' : 'border-white ring-1 ring-slate-100'}`}>
              <div className="flex gap-5">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-slate-200 shrink-0 select-none">{resto.image}</div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg truncate pr-2 text-slate-800 leading-tight">{resto.name}</h3>
                        <span className="text-slate-500 font-bold text-[10px] bg-slate-100 px-2 py-1 rounded-md tracking-wide">{resto.price}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-2">
                        <StarRating rating={resto.rating} />
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="font-medium">{resto.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="font-medium">{resto.reviews} 則評論</span>
                      </div>
                  </div>

                  {/* 洗評警告與按鈕 (鎖定邏輯) */}
                  <div className="mt-4 flex items-center justify-between">
                    {!isFeatureUnlocked && resto.isSpam ? (
                        <button 
                            onClick={() => setShowPremiumModal(true)}
                            className="flex items-center gap-1.5 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 transition shadow-md shadow-slate-200"
                        >
                            <Lock size={12}/> 解鎖分析
                        </button>
                    ) : (isFeatureUnlocked && resto.isSpam ? (
                      <div className="text-xs text-rose-600 font-bold flex items-center gap-1.5 bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200">
                          <AlertTriangle size={14} /> 疑似洗評 {(resto.washRatio*100).toFixed(0)}%
                      </div>
                    ) : (
                      <div className="text-xs text-teal-600 font-bold flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                          <CheckCircle size={14} /> 評論健康
                      </div>
                    ))}
                    
                    <a href={resto.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition group-hover:opacity-100 opacity-60">
                      <span>Google Maps</span> <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
        ))}
        
        {processedRestaurants.length === 0 && !isSearching && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl grayscale opacity-50">🤔</div>
            <p className="text-sm font-medium">沒有符合條件的餐廳<br/>試試看放寬過濾條件？</p>
          </div>
        )}
      </div>
    </div>
  );
}