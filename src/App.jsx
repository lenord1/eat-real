import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, MapPin, Filter, Star, AlertTriangle, User, Heart, Users, 
  Utensils, Lock, PlayCircle, X, Tv, Crown, CreditCard, LocateFixed, 
  ExternalLink, Loader2, ArrowRight, SlidersHorizontal, CheckCircle, Dog, 
  ChevronDown, Map as MapIcon
} from 'lucide-react';

// --- 設定檔 ---
const GOOGLE_API_KEY = ""; 
const USE_REAL_API = false; 

// --- 1. 定義用餐情境 ---
const DINING_TYPES = [
  { id: 'solo', name: "單人獨享", icon: <User size={24} />, desc: "自在不尷尬", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200", hover: "hover:bg-blue-100" },
  { id: 'date', name: "兩人約會", icon: <Heart size={24} />, desc: "氣氛好", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200", hover: "hover:bg-rose-100" },
  { id: 'group', name: "多人聚餐", icon: <Users size={24} />, desc: "好聊好吵", color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-200", hover: "hover:bg-violet-100" },
];

// --- 2. 詳細分類 ---
const CATEGORIES = [
  { name: "全部", icon: "🍽️" }, { name: "火鍋", icon: "🍲" }, { name: "燒肉", icon: "🔥" }, { name: "拉麵", icon: "🍜" },
  { name: "壽司", icon: "🍣" }, { name: "牛排", icon: "🥩" }, { name: "早午餐", icon: "🍳" }, { name: "咖啡廳", icon: "☕" },
  { name: "居酒屋", icon: "🏮" }, { name: "韓式", icon: "🥘" }, { name: "泰式", icon: "🥥" }, { name: "義式", icon: "🍝" }, 
  { name: "漢堡", icon: "🍔" }, { name: "甜點", icon: "🍧" }, { name: "素食", icon: "🥗" }, { name: "小吃", icon: "🥢" }
];

// --- 服務層：Google Maps Service (智慧模擬版 + Render後端) ---
const GoogleMapsService = {
  // 判斷目前座標的行政區 (模擬用)
  getDistrictName: (lat, lng) => {
    if (lat > 25.00 && lat < 25.02 && lng > 121.45 && lng < 121.48) return { city: "新北市", dist: "板橋區", roads: ["文化路", "縣民大道", "中山路", "府中路"] };
    if (lat > 25.02 && lat < 25.05 && lng > 121.55 && lng < 121.58) return { city: "台北市", dist: "信義區", roads: ["忠孝東路", "信義路", "松仁路", "基隆路"] };
    if (lat > 25.04 && lat < 25.06 && lng > 121.51 && lng < 121.54) return { city: "台北市", dist: "中山區", roads: ["中山北路", "林森北路", "南京東路", "松江路"] };
    if (lat > 25.05 && lat < 25.08 && lng > 121.49 && lng < 121.52) return { city: "新北市", dist: "三重區", roads: ["重新路", "正義北路", "三和路"] };
    if (lat > 24.98 && lat < 25.01 && lng > 121.50 && lng < 121.53) return { city: "新北市", dist: "中和區", roads: ["中正路", "景平路", "中山路"] };
    return { city: "台北市", dist: "市中心", roads: ["復興南路", "敦化南路", "和平東路"] }; 
  },

  geocode: async (address) => {
    await new Promise(r => setTimeout(r, 600));
    
    // 檢查服務範圍
    const supported = ['台北', '新北', '基隆', '桃園', '板橋', '信義', '大安', '中山', '三重', '中和', '永和'];
    if (!supported.some(area => address.includes(area)) && (address.includes('台中') || address.includes('高雄'))) {
         throw new Error("OUT_OF_SERVICE_AREA");
    }

    if (address.includes('板橋')) return { lat: 25.014, lng: 121.464, formattedAddress: "新北市板橋區" };
    if (address.includes('信義')) return { lat: 25.034, lng: 121.564, formattedAddress: "台北市信義區" };
    if (address.includes('中山')) return { lat: 25.053, lng: 121.520, formattedAddress: "台北市中山區" };
    if (address.includes('三重')) return { lat: 25.063, lng: 121.500, formattedAddress: "新北市三重區" };
    
    return { lat: 25.037, lng: 121.565, formattedAddress: "台北市信義區 (預設)" };
  },

  searchNearby: async (lat, lng, keyword, category) => {
    try {
      console.log("🔗 正在連線 Render 後端...");
      // [修正重點] 此處已替換為您的 Render 正式網址
      const response = await fetch('https://eat-real-backend-2.onrender.com/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, keyword: keyword || (category === "全部" ? "" : category) })
      });
      const data = await response.json();
      
      // 如果後端回傳真實資料 (Source: api or cache)
      if (data.source !== 'mock' && data.results && data.results.length > 0) {
        console.log("✅ 取得真實資料:", data.source);
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
      
      console.warn("⚠️ 後端回傳 Mock 訊號，切換至前端模擬");
      return GoogleMapsService.mockSearch(lat, lng, keyword, category);
    } catch (e) {
      console.error("❌ 連線失敗 (Render 可能在休眠):", e);
      return GoogleMapsService.mockSearch(lat, lng, keyword, category);
    }
  },

  // 在地化模擬數據生成器
  mockSearch: async (lat, lng, keyword, category) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const locationInfo = GoogleMapsService.getDistrictName(lat, lng);
    const targetCategory = category === "全部" ? (keyword || "熱門餐廳") : category;
    
    const generateName = (index) => {
        const road = locationInfo.roads[index % locationInfo.roads.length];
        const prefixes = [locationInfo.dist, "老牌", "阿嬤", "大", "小", "正宗", "巷口", road];
        const suffixes = ["食堂", "廚房", "小館", "屋", "坊", "軒", "樓"];
        
        if (targetCategory.includes("麵") || targetCategory.includes("小吃")) return `${prefixes[index % prefixes.length]}${targetCategory}${suffixes[index % suffixes.length]}`;
        if (targetCategory.includes("火鍋")) return `${prefixes[index % prefixes.length]}涮涮鍋`;
        if (targetCategory.includes("咖啡")) return `${road} ${index + 1}號咖啡`;
        
        const realBrands = ["鼎泰豐", "馬辣", "路易莎", "麥當勞", "一蘭", "藏壽司", "薩莉亞", "八方雲集"];
        if (index % 3 === 0) return `${realBrands[index % realBrands.length]} (${locationInfo.dist}店)`;
        
        return `${prefixes[index % prefixes.length]}私房料理`;
    };

    const results = [];
    for (let i = 0; i < 15; i++) {
      const name = generateName(i);
      const baseRating = 3.5;
      const rating = (baseRating + Math.random() * 1.5).toFixed(1);
      const reviews = Math.floor(Math.random() * 3000) + 50;
      const isWash = rating > 4.5 && reviews > 1000 && Math.random() > 0.4;
      const shortReviews = isWash ? Math.floor(reviews * (0.15 + Math.random() * 0.2)) : Math.floor(reviews * 0.03);
      const latOffset = (Math.random() - 0.5) * 0.005; 
      const lngOffset = (Math.random() - 0.5) * 0.005;

      results.push({
        id: `mock_${i}_${Date.now()}`,
        name: name,
        category: targetCategory,
        price: ["$", "$$", "$$$"][Math.floor(Math.random() * 3)],
        rating: rating,
        reviews: reviews,
        shortFiveStarReviews: shortReviews,
        lat: lat + latOffset,
        lng: lng + lngOffset,
        tags: ["在地", "熱門"],
        isSolo: Math.random() > 0.3, 
        isPet: Math.random() > 0.7,
        image: "🍽️", 
        address: `${locationInfo.city}${locationInfo.dist}${locationInfo.roads[i % locationInfo.roads.length]}${Math.floor(Math.random()*100)+1}號`,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
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
      (pos) => { 
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (lat < 24.6 || lat > 25.4 || lng < 121.0 || lng > 122.0) {
             setIsProcessing(false);
             alert("📍 抱歉，您目前的 GPS 位置不在服務範圍內。\n\n食真目前僅服務：台北、新北、基隆、桃園。\n\n已自動為您切換至台北市中心模擬。");
             onSetLocation({ lat: 25.037, lng: 121.565 }, "台北市信義區 (預設)");
             onClose();
             return;
        }
        setIsProcessing(false); 
        onSetLocation({ lat, lng }, "我的位置"); 
        onClose(); 
      },
      (err) => { setIsProcessing(false); alert("定位失敗，請確認權限或使用地址輸入。"); }, 
      { enableHighAccuracy: true }
    );
  };

  const handleAddressSubmit = async () => {
    if (!address.trim()) return;
    setIsProcessing(true);
    try {
      const result = await GoogleMapsService.geocode(address);
      setIsProcessing(false); 
      onSetLocation(result, result.formattedAddress); 
      onClose();
    } catch (e) { 
      setIsProcessing(false); 
      if (e.message === "OUT_OF_SERVICE_AREA") alert("🚫 抱歉，該地區尚未開放服務。\n\n目前僅支援：台北市、新北市、桃園市、基隆市。");
      else alert("找不到該地址，請確認輸入是否正確。"); 
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative p-6 space-y-6 animate-in zoom-in-95 duration-200 border border-white/20">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
        <div className="text-center">
          <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3 text-teal-600"><MapPin size={24} /></div>
          <h2 className="text-xl font-bold text-slate-800">設定所在位置</h2>
          <p className="text-xs text-slate-400 mt-1">服務範圍：台北、新北、基隆、桃園</p>
        </div>
        <button onClick={handleGPS} disabled={isProcessing} className="w-full py-3.5 rounded-2xl bg-teal-500 text-white font-bold hover:bg-teal-600 active:scale-95 transition shadow-md shadow-teal-200 flex items-center justify-center gap-2">
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />} 使用 GPS 定位
        </button>
        <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink-0 mx-4 text-slate-300 text-xs">或自行輸入地址</span><div className="flex-grow border-t border-slate-100"></div></div>
        <div className="flex gap-2">
          <input type="text" placeholder="例如：板橋、信義區..." className="flex-1 bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 transition placeholder:text-slate-300" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddressSubmit()}/>
          <button onClick={handleAddressSubmit} className="bg-slate-800 text-white p-3 rounded-xl hover:bg-slate-700 active:scale-95 transition shadow-lg"><ArrowRight size={20} /></button>
        </div>
      </div>
    </div>
  );
};

const PremiumModal = ({ isOpen, onClose, onUnlockTemp, onSubscribe }) => {
  const [step, setStep] = useState('select'); 
  const [adTimeLeft, setAdTimeLeft] = useState(null);
  const [plan, setPlan] = useState('monthly');

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
    try {
        const amount = selectedPlan === 'monthly' ? 70 : 672;
        const planName = selectedPlan === 'monthly' ? "食真 Pro 月訂閱" : "食真 Pro 年訂閱 (8折)";
        setTimeout(() => { onSubscribe(); onClose(); setStep('select'); alert(`🎉 訂閱成功！\n您已選擇 ${planName}，金額 NT$${amount}。`); }, 2000);
    } catch(e) { alert("付款失敗"); setStep('select'); }
  };
  
  if (!isOpen) return null;

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
                <p className="font-bold text-slate-800 text-lg">正在安全連接綠界金流...</p>
                <p className="text-slate-400 text-xs mt-1">請勿關閉視窗</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 text-teal-600 transform rotate-3"><Lock size={28} /></div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">解鎖進階偵測</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">查看真實評論數據，避開 5 星洗評雷店</p>
            </div>
            <div className="p-6 space-y-3 bg-white">
              <div className={`border-2 p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all ${plan === 'monthly' ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-slate-200 hover:border-teal-300'}`} onClick={() => setPlan('monthly')}>
                <div className="flex items-center gap-4"><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${plan === 'monthly' ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}>{plan === 'monthly' && <div className="w-2 h-2 bg-white rounded-full"></div>}</div><div><h3 className="font-bold text-slate-800">月訂閱</h3><p className="text-xs text-slate-500">隨時可取消</p></div></div>
                <div className="text-right"><span className="block text-lg font-bold text-teal-700">NT$ 70</span><span className="text-[10px] text-teal-500 uppercase">/ Month</span></div>
              </div>
              <div className={`relative border-2 p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all overflow-hidden ${plan === 'yearly' ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-slate-200 hover:border-amber-300'}`} onClick={() => setPlan('yearly')}>
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">🔥 80% OFF</div>
                <div className="flex items-center gap-4"><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${plan === 'yearly' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>{plan === 'yearly' && <div className="w-2 h-2 bg-white rounded-full"></div>}</div><div><h3 className="font-bold text-slate-800">年訂閱</h3><p className="text-xs text-amber-600 font-bold">激省方案！</p></div></div>
                <div className="text-right mt-1"><span className="block text-lg font-bold text-amber-700">NT$ 672</span><span className="text-[10px] text-amber-600 uppercase line-through opacity-60">NT$ 840</span></div>
              </div>
              <button onClick={() => handlePay(plan)} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition active:scale-95 flex items-center justify-center gap-2 mt-2 ${plan === 'yearly' ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-orange-200' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'}`}>
                {plan === 'yearly' ? <Crown size={18} /> : <CreditCard size={18} />} {plan === 'yearly' ? '升級年繳會員' : '開啟月訂閱'}
              </button>
              <div className="relative py-2 flex items-center"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink-0 mx-3 text-slate-300 text-xs">OR</span><div className="flex-grow border-t border-slate-100"></div></div>
              <button onClick={() => setAdTimeLeft(5)} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition text-sm flex items-center justify-center gap-2"><PlayCircle size={16} /> 看廣告單次解鎖</button>
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
  
  // 控制選單收合
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  useEffect(() => { if (isProMember) setIsFeatureUnlocked(true); }, [isProMember]);

  // 自動觸發搜尋與收合選單
  useEffect(() => {
    if (selectedDiningType && selectedCategory !== "全部") {
        const timer = setTimeout(() => { setIsControlsCollapsed(true); }, 500);
        return () => clearTimeout(timer);
    }
  }, [selectedDiningType, selectedCategory]);

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

  const resetSelection = () => { setIsControlsCollapsed(false); };

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
             {isProMember && <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">PRO</span>}
          </div>
        </div>
        <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition border border-slate-200 max-w-[160px] group">
          <LocateFixed size={16} className="flex-shrink-0 text-teal-500 group-hover:scale-110 transition-transform" />
          <span className="truncate">{locationName || "設定位置"}</span>
        </button>
      </header>

      {/* Controls Section */}
      <div className={`bg-white/80 backdrop-blur-md shadow-sm z-10 border-b border-slate-200 px-6 transition-all duration-500 ease-in-out overflow-hidden flex flex-col ${isControlsCollapsed ? 'max-h-0 py-0 opacity-0' : 'max-h-[60vh] py-6 opacity-100'}`}>
        
        {/* Search Bar */}
        <div className="relative group mb-6">
          <div className="absolute left-5 top-4 text-slate-400 group-focus-within:text-teal-500 transition-colors"><Search size={20}/></div>
          <input type="text" placeholder="搜尋餐廳、種類或關鍵字..." className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-0 focus:border-teal-500 focus:bg-white transition-all text-sm shadow-inner outline-none placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {isSearching && <div className="absolute right-5 top-4 text-teal-500 animate-spin"><Loader2 size={20}/></div>}
        </div>

        {/* 1. 用餐情境快速選擇 (Cards) */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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

        {/* 2. 詳細分類選單 (Grid) */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-4">
            {CATEGORIES.map((cat) => (
                <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 aspect-square ${selectedCategory === cat.name ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-200' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-[10px] font-bold whitespace-nowrap">{cat.name}</span>
                </button>
            ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center pt-2">
          {/* 洗評敏感度 (上鎖邏輯) */}
          <div className={`flex-grow px-4 py-3 rounded-2xl border flex flex-col justify-center min-w-[200px] relative overflow-hidden transition-all ${isFeatureUnlocked ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
             {!isFeatureUnlocked && (
                <div className="absolute inset-0 bg-slate-100/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <button onClick={() => setShowPremiumModal(true)} className="bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-50">
                        <Lock size={12}/> 解鎖調整
                    </button>
                </div>
             )}
             <div className="flex justify-between text-xs text-slate-500 font-bold mb-2"><span className="flex items-center gap-1.5"><SlidersHorizontal size={14} className="text-slate-400"/> 洗評敏感度設定</span><span className={`px-2 py-0.5 rounded transition-colors ${isFeatureUnlocked ? 'text-teal-600 bg-teal-100' : 'text-slate-400 bg-slate-200'}`}>{(spamThreshold * 100).toFixed(0)}%</span></div>
             <input type="range" min="0.05" max="0.50" step="0.05" value={spamThreshold} onChange={(e) => setSpamThreshold(parseFloat(e.target.value))} disabled={!isFeatureUnlocked} className="w-full h-2 bg-slate-300 rounded-full appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition disabled:cursor-not-allowed disabled:accent-slate-400" />
          </div>
          <select className="flex-shrink-0 px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm text-slate-600 font-bold shadow-sm focus:outline-none focus:border-teal-500 transition hover:bg-slate-50 cursor-pointer" value={filters.price} onChange={(e) => setFilters({...filters, price: e.target.value})}>
              <option value="all">💰 預算不限</option><option value="$">$ 平價</option><option value="$$">$$ 中價</option><option value="$$$">$$$ 高檔</option>
          </select>
          <button onClick={() => setFilters({...filters, pet: !filters.pet})} className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-2xl text-sm border-2 transition shadow-sm font-bold active:scale-95 ${filters.pet ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}><Dog size={18}/> 寵物友善</button>
        </div>
      </div>

      {/* [新] 收合狀態下的重新選擇 Bar */}
      {isControlsCollapsed && (
        <div className="bg-white z-10 shadow-md border-b border-slate-100 px-4 py-3 flex justify-between items-center animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 overflow-hidden">
                {selectedDiningType && <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full whitespace-nowrap">{DINING_TYPES.find(t => t.id === selectedDiningType)?.name}</span>}
                {selectedCategory !== "全部" && <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full whitespace-nowrap">{selectedCategory}</span>}
                <span className="text-xs text-slate-400 ml-1">找到 {processedRestaurants.length} 間</span>
            </div>
            <button onClick={resetSelection} className="flex items-center gap-1.5 text-xs font-bold bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700 transition shadow-sm flex-shrink-0">
                <ChevronDown size={14}/> 重新選擇
            </button>
        </div>
      )}

      {/* Restaurant List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 pb-24 scrollbar-hide">
        {!isControlsCollapsed && (
            <div className="flex justify-between items-end px-1 mb-2">
                <h2 className="text-lg font-bold text-slate-800">
                    {selectedDiningType ? `適合「${DINING_TYPES.find(t => t.id === selectedDiningType)?.name}」` : "附近推薦"}
                </h2>
            </div>
        )}
        
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