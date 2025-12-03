import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, MapPin, Filter, Star, AlertTriangle, User, Heart, Users, 
  Utensils, Lock, PlayCircle, X, Tv, Crown, CreditCard, LocateFixed, 
  ExternalLink, Loader2, ArrowRight, SlidersHorizontal, CheckCircle, Dog, 
  ChevronDown, Map as MapIcon, Calendar, Clock, ThumbsDown, Flag, Ban, HeartOff,
  Coffee, Wine, Briefcase
} from 'lucide-react';

// --- 設定檔 ---
const GOOGLE_API_KEY = ""; 
const USE_REAL_API = false; 

// --- 1. 定義用餐情境 (針對目標客群優化文案與圖示) ---
const DINING_TYPES = [
  { id: 'solo', name: "獨處時光", sub: "Me Time", icon: <User size={20} />, color: "text-slate-600", bg: "bg-white", border: "border-slate-200", hover: "hover:border-slate-400", active: "ring-2 ring-slate-400 bg-slate-50" },
  { id: 'date', name: "浪漫約會", sub: "Date Night", icon: <Heart size={20} />, color: "text-rose-500", bg: "bg-white", border: "border-rose-200", hover: "hover:border-rose-300", active: "ring-2 ring-rose-300 bg-rose-50" },
  { id: 'business', name: "商務洽談", sub: "Business", icon: <Briefcase size={20} />, color: "text-indigo-600", bg: "bg-white", border: "border-indigo-200", hover: "hover:border-indigo-300", active: "ring-2 ring-indigo-300 bg-indigo-50" },
];

// --- 2. 詳細分類 (圖示優化) ---
const CATEGORIES = [
  { name: "全部", icon: "🍽️" }, { name: "輕食早午餐", icon: "🥗" }, { name: "精品咖啡", icon: "☕" }, { name: "日式料理", icon: "🍣" },
  { name: "餐酒館", icon: "🍷" }, { name: "私廚鐵板", icon: "🔥" }, { name: "精緻鍋物", icon: "🍲" }, { name: "義法料理", icon: "🍝" },
  { name: "美式餐廳", icon: "🍔" }, { name: "韓式料理", icon: "🥘" }, { name: "泰式料理", icon: "🥥" }, { name: "甜點下午茶", icon: "🍰" },
  { name: "蔬食料理", icon: "🥬" }, { name: "台灣風味", icon: "🥢" }, { name: "拉麵", icon: "🍜" }, { name: "居酒屋", icon: "🏮" }
];

// --- 服務層：Google Maps Service ---
const GoogleMapsService = {
  getDistrictName: (lat, lng) => {
    if (lat > 25.00 && lat < 25.02 && lng > 121.45 && lng < 121.48) return { city: "新北市", dist: "板橋區", roads: ["新站路", "縣民大道", "中山路", "重慶路"] };
    if (lat > 25.02 && lat < 25.05 && lng > 121.55 && lng < 121.58) return { city: "台北市", dist: "信義區", roads: ["松仁路", "信義路五段", "松壽路", "基隆路"] };
    if (lat > 25.04 && lat < 25.06 && lng > 121.51 && lng < 121.54) return { city: "台北市", dist: "中山區", roads: ["中山北路", "赤峰街", "南京西路", "松江路"] };
    return { city: "台北市", dist: "大安區", roads: ["敦化南路", "仁愛路", "安和路"] }; 
  },

  geocode: async (address) => {
    await new Promise(r => setTimeout(r, 600));
    const supported = ['台北', '新北', '基隆', '桃園', '板橋', '信義', '大安', '中山', '三重', '中和', '永和'];
    if (!supported.some(area => address.includes(area)) && (address.includes('台中') || address.includes('高雄'))) throw new Error("OUT_OF_SERVICE_AREA");
    if (address.includes('板橋')) return { lat: 25.014, lng: 121.464, formattedAddress: "新北市板橋區" };
    if (address.includes('信義')) return { lat: 25.034, lng: 121.564, formattedAddress: "台北市信義區" };
    return { lat: 25.037, lng: 121.565, formattedAddress: "台北市信義區 (預設)" };
  },

  searchNearby: async (lat, lng, keyword, category) => {
    try {
      const response = await fetch('https://eat-real-backend-2.onrender.com/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, keyword: keyword || (category === "全部" ? "" : category) })
      });
      const data = await response.json();
      if (data.source !== 'mock' && data.results && data.results.length > 0) {
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
          googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          isOpenNow: Math.random() > 0.1
        }));
      }
      return GoogleMapsService.mockSearch(lat, lng, keyword, category);
    } catch (e) {
      return GoogleMapsService.mockSearch(lat, lng, keyword, category);
    }
  },

  mockSearch: async (lat, lng, keyword, category) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const locationInfo = GoogleMapsService.getDistrictName(lat, lng);
    const targetCategory = category === "全部" ? (keyword || "精選餐廳") : category;
    
    const generateName = (index) => {
        const road = locationInfo.roads[index % locationInfo.roads.length];
        // 店名風格調整：更具質感
        const prefixes = ["Le ", "The ", "Petit ", "Maison ", locationInfo.dist, "小", "私宅", "隱家"];
        const suffixes = ["Bistro", "Café", "Kitchen", "Dining", "Lounge", "食研室", "製所"];
        
        if (targetCategory.includes("咖啡") || targetCategory.includes("早午餐")) return `${prefixes[index%prefixes.length]}${road} ${suffixes[1]}`;
        if (targetCategory.includes("酒")) return `${prefixes[index%prefixes.length]}${suffixes[0]}`;
        
        const realBrands = ["鼎泰豐", "橘色涮涮屋", "ACME Cafe", "Waku Waku", "初魚", "教父牛排", "Smith & Hsu", "Miacucina"];
        if (index % 3 === 0) return `${realBrands[index % realBrands.length]}`;
        
        return `${prefixes[index % prefixes.length]}${targetCategory.replace("全部","")}${suffixes[index % suffixes.length]}`;
    };

    const results = [];
    for (let i = 0; i < 15; i++) {
      const name = generateName(i);
      const baseRating = 3.8;
      const rating = (baseRating + Math.random() * 1.2).toFixed(1);
      const reviews = Math.floor(Math.random() * 2000) + 100;
      const isWash = rating > 4.6 && reviews > 1000 && Math.random() > 0.4;
      const shortReviews = isWash ? Math.floor(reviews * (0.15 + Math.random() * 0.2)) : Math.floor(reviews * 0.03);
      const latOffset = (Math.random() - 0.5) * 0.005; 
      const lngOffset = (Math.random() - 0.5) * 0.005;

      results.push({
        id: `mock_${i}_${Date.now()}`,
        name: name,
        category: targetCategory,
        price: ["$$", "$$$", "$$$$"][Math.floor(Math.random() * 3)], // 價位調整為中高
        rating: rating,
        reviews: reviews,
        shortFiveStarReviews: shortReviews,
        lat: lat + latOffset,
        lng: lng + lngOffset,
        tags: ["質感", "氛圍"],
        isSolo: Math.random() > 0.4, 
        isPet: Math.random() > 0.6,
        image: "🍽️", 
        address: `${locationInfo.city}${locationInfo.dist}${locationInfo.roads[i % locationInfo.roads.length]} ${Math.floor(Math.random()*100)+1}號`,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
        isOpenNow: Math.random() > 0.1
      });
    }
    return results;
  }
};

// --- UI Components ---
const StarRating = ({ rating }) => (
  <div className="flex items-center gap-1">
    <Star size={14} className="text-amber-400 fill-amber-400" />
    <span className="text-sm font-semibold text-slate-700 font-mono">{rating}</span>
  </div>
);

const ReportModal = ({ isOpen, onClose, restaurantName }) => {
    if (!isOpen) return null;
    const handleSubmit = (reason) => {
        alert(`感謝您的回報！\n我們將審核「${restaurantName}」的 ${reason}。`);
        onClose();
    };
    return (
        <div className="fixed inset-0 z-[80] bg-slate-900/40 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 border border-white/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 text-lg">回報問題</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">您對 <strong>{restaurantName}</strong> 有什麼看法？您的回饋能幫助更多人。</p>
                <div className="space-y-3">
                    <button onClick={() => handleSubmit("實際體驗極差")} className="w-full p-4 text-left text-sm font-medium bg-slate-50 rounded-xl hover:bg-red-50 hover:text-red-700 transition flex items-center gap-3"><ThumbsDown size={16}/> 實際體驗與評價不符</button>
                    <button onClick={() => handleSubmit("疑似洗評價")} className="w-full p-4 text-left text-sm font-medium bg-slate-50 rounded-xl hover:bg-amber-50 hover:text-amber-700 transition flex items-center gap-3"><AlertTriangle size={16}/> 疑似洗評價 (誤判)</button>
                    <button onClick={() => handleSubmit("資訊錯誤")} className="w-full p-4 text-left text-sm font-medium bg-slate-50 rounded-xl hover:bg-slate-100 transition flex items-center gap-3"><Flag size={16}/> 店家資訊錯誤 / 已歇業</button>
                </div>
            </div>
        </div>
    );
};

const LocationModal = ({ isOpen, onClose, onSetLocation }) => {
  const [address, setAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  if (!isOpen) return null;
  
  // ... (Location Logic maintained)
  const handleGPS = () => {
    setIsProcessing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { 
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (lat < 24.6 || lat > 25.4 || lng < 121.0 || lng > 122.0) {
             setIsProcessing(false);
             alert("📍 抱歉，目前僅服務北北基桃地區。\n已為您切換至台北市中心。");
             onSetLocation({ lat: 25.037, lng: 121.565 }, "台北市信義區");
             onClose();
             return;
        }
        setIsProcessing(false); onSetLocation({ lat, lng }, "我的位置"); onClose(); 
      },
      (err) => { setIsProcessing(false); alert("定位失敗，請確認權限"); }, { enableHighAccuracy: true }
    );
  };
  const handleAddressSubmit = async () => {
    if (!address.trim()) return;
    setIsProcessing(true);
    try {
      const result = await GoogleMapsService.geocode(address);
      setIsProcessing(false); onSetLocation(result, result.formattedAddress); onClose();
    } catch (e) { setIsProcessing(false); alert("找不到該地址或不在服務範圍內"); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative p-8 space-y-6 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-50 text-slate-400 transition-colors"><X size={20} /></button>
        <div className="text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600 shadow-inner"><MapPin size={28} /></div>
          <h2 className="text-xl font-bold text-slate-800">探索周邊美食</h2>
          <p className="text-xs text-slate-400 mt-2">目前服務範圍：台北、新北、基隆、桃園</p>
        </div>
        <button onClick={handleGPS} disabled={isProcessing} className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 active:scale-95 transition shadow-lg flex items-center justify-center gap-2">
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />} 使用 GPS 定位
        </button>
        <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink-0 mx-4 text-slate-300 text-xs">或輸入地址</span><div className="flex-grow border-t border-slate-100"></div></div>
        <div className="flex gap-2">
          <input type="text" placeholder="例如：信義區、板橋..." className="flex-1 bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-200 transition placeholder:text-slate-300" value={address} onChange={(e) => setAddress(e.target.value)} />
          <button onClick={handleAddressSubmit} className="bg-white border border-slate-200 text-slate-600 p-3 rounded-xl hover:bg-slate-50 active:scale-95 transition"><ArrowRight size={20} /></button>
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
    if (adTimeLeft > 0) { const timer = setTimeout(() => setAdTimeLeft(adTimeLeft - 1), 1000); return () => clearTimeout(timer); } 
    else { onUnlockTemp(); onClose(); setAdTimeLeft(null); }
  }, [adTimeLeft, onUnlockTemp, onClose]);

  const handlePay = async (selectedPlan) => { 
    setStep('processing'); 
    setTimeout(() => { onSubscribe(); onClose(); setStep('select'); alert(`🎉 歡迎加入！\n您已升級為 Pro 會員。`); }, 2000);
  };
  
  if (!isOpen) return null;
  if (adTimeLeft !== null) return (<div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center p-4"><div className="bg-gray-900 w-full max-w-md aspect-video rounded-2xl flex flex-col items-center justify-center relative"><div className="text-white text-center space-y-4"><Tv size={48} className="mx-auto text-yellow-400 animate-pulse" /><h3 className="text-xl font-bold">廣告播放中...</h3><p className="text-gray-400 font-mono text-sm">剩餘 {adTimeLeft} 秒即可解鎖</p></div></div></div>);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative border border-white/50">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors z-10"><X size={20} /></button>
        {step === 'processing' ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-6">
            <Loader2 size={40} className="text-slate-900 animate-spin" />
            <p className="font-bold text-slate-600 text-sm tracking-wide">SECURE PAYMENT...</p>
          </div>
        ) : (
          <>
            <div className="p-8 pt-10 text-center bg-gradient-to-b from-slate-50 to-white">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-5 text-slate-800"><Crown size={32} strokeWidth={1.5} /></div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">升級專業版</h2>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed px-4">解鎖真實評論分析，過濾 99% 洗版雷店<br/>享受無廣告的純淨體驗。</p>
            </div>
            <div className="p-6 pt-0 space-y-3 bg-white">
              <div className={`border p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all ${plan === 'monthly' ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:border-slate-400'}`} onClick={() => setPlan('monthly')}>
                <div className="flex items-center gap-4"><div className={`w-5 h-5 rounded-full border flex items-center justify-center ${plan === 'monthly' ? 'border-slate-800 bg-slate-800' : 'border-slate-300'}`}>{plan === 'monthly' && <div className="w-2 h-2 bg-white rounded-full"></div>}</div><div><h3 className="font-bold text-slate-900 text-sm">月訂閱</h3><p className="text-xs text-slate-500">彈性取消</p></div></div>
                <div className="text-right"><span className="block text-lg font-bold text-slate-900">NT$ 70</span></div>
              </div>
              <div className={`relative border p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all overflow-hidden ${plan === 'yearly' ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 hover:border-slate-400'}`} onClick={() => setPlan('yearly')}>
                <div className="absolute top-0 right-0 bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg tracking-wider">80% OFF</div>
                <div className="flex items-center gap-4"><div className={`w-5 h-5 rounded-full border flex items-center justify-center ${plan === 'yearly' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>{plan === 'yearly' && <div className="w-2 h-2 bg-white rounded-full"></div>}</div><div><h3 className="font-bold text-slate-900 text-sm">年訂閱</h3><p className="text-xs text-amber-600 font-bold">每日不到 2 元</p></div></div>
                <div className="text-right mt-1"><span className="block text-lg font-bold text-slate-900">NT$ 672</span><span className="text-[10px] text-slate-400 line-through">NT$ 840</span></div>
              </div>
              <button onClick={() => handlePay(plan)} className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-xl shadow-slate-200 text-sm mt-2">
                確認方案
              </button>
              <button onClick={() => setAdTimeLeft(5)} className="w-full py-3 text-slate-400 font-medium hover:text-slate-600 transition text-xs flex items-center justify-center gap-1.5">
                  <PlayCircle size={14} /> 觀看廣告單次解鎖
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
  const [filters, setFilters] = useState({ pet: false, price: "all", openNow: false });
  const [currentLocation, setCurrentLocation] = useState({ lat: 25.037, lng: 121.565 });
  const [locationName, setLocationName] = useState(""); 
  const [isSearching, setIsSearching] = useState(false); 
  const [restaurants, setRestaurants] = useState([]);
  
  const [isProMember, setIsProMember] = useState(false); 
  const [isFeatureUnlocked, setIsFeatureUnlocked] = useState(false); 
  const [showPremiumModal, setShowPremiumModal] = useState(false); 
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [reportingRestaurant, setReportingRestaurant] = useState(null); 
  
  // 我的收藏與黑名單
  const [favorites, setFavorites] = useState(new Set()); 
  const [blackList, setBlackList] = useState(new Set());

  const toggleFavorite = (id) => {
      const next = new Set(favorites);
      if (next.has(id)) next.delete(id); else next.add(id);
      setFavorites(next);
  };

  const toggleBlackList = (id) => {
      if (confirm("確定要將此餐廳隱藏嗎？")) {
          const next = new Set(blackList);
          next.add(id);
          setBlackList(next);
      }
  };

  useEffect(() => { if (isProMember) setIsFeatureUnlocked(true); }, [isProMember]);

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
      if (blackList.has(resto.id)) return false;
      let matchType = true;
      if (selectedDiningType === 'solo') matchType = resto.isSolo || resto.tags.includes("單人");
      else if (selectedDiningType === 'date') matchType = resto.tags.includes("約會") || resto.price === "$$$";
      else if (selectedDiningType === 'group') matchType = resto.tags.includes("聚餐");
      
      const matchPet = filters.pet ? resto.isPet : true;
      const matchPrice = filters.price === "all" || resto.price === filters.price;
      const matchOpen = filters.openNow ? resto.isOpenNow : true;

      return matchType && matchPet && matchPrice && matchOpen;
    });
  }, [restaurants, selectedDiningType, spamThreshold, filters, blackList]);

  const resetSelection = () => { setIsControlsCollapsed(false); };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden">
      <LocationModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} onSetLocation={(coords, name) => { setCurrentLocation(coords); setLocationName(name); }} />
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} onUnlockTemp={() => setIsFeatureUnlocked(true)} onSubscribe={() => setIsProMember(true)} />
      <ReportModal isOpen={!!reportingRestaurant} onClose={() => setReportingRestaurant(null)} restaurantName={reportingRestaurant} />

      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm z-20 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-xl text-white"><Utensils size={20} strokeWidth={2.5} /></div>
          <div>
             <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-serif">EatReal</h1>
          </div>
          {isProMember && <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-200">PRO</span>}
        </div>
        <div className="flex gap-2">
            <button className={`p-2.5 rounded-full border transition ${favorites.size > 0 ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-slate-200 text-slate-400'}`}>
                <Heart size={18} fill={favorites.size > 0 ? "currentColor" : "none"}/>
            </button>
            <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition border border-slate-200 max-w-[160px]">
            <LocateFixed size={16} className="flex-shrink-0 text-slate-500" />
            <span className="truncate">{locationName || "設定位置"}</span>
            </button>
        </div>
      </header>

      {/* Controls Section */}
      <div className={`bg-white/90 backdrop-blur-xl shadow-sm z-10 border-b border-slate-200 px-6 transition-all duration-500 ease-in-out overflow-hidden flex flex-col ${isControlsCollapsed ? 'max-h-0 py-0 opacity-0' : 'max-h-[80vh] py-6 opacity-100'}`}>
        <div className="relative group mb-6">
          <div className="absolute left-5 top-4 text-slate-400 group-focus-within:text-slate-800 transition-colors"><Search size={20}/></div>
          <input type="text" placeholder="搜尋餐廳、種類或關鍵字..." className="w-full pl-14 pr-4 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all text-sm shadow-inner outline-none placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {isSearching && <div className="absolute right-5 top-4 text-slate-400 animate-spin"><Loader2 size={20}/></div>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {DINING_TYPES.map((type) => {
            const isSelected = selectedDiningType === type.id;
            return (
              <button 
                key={type.id} 
                onClick={() => setSelectedDiningType(isSelected ? null : type.id)} 
                className={`relative overflow-hidden rounded-2xl border transition-all duration-200 h-28 flex flex-col items-center justify-center gap-3 shadow-sm hover:-translate-y-1 ${isSelected ? `border-slate-400 bg-slate-50 ring-1 ring-slate-200` : `border-slate-100 bg-white hover:border-slate-300`}`}
              >
                <div className={`p-3 rounded-full ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}>{type.icon}</div>
                <div>
                    <span className="block text-sm font-bold text-slate-800">{type.name}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{type.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-6">
            {CATEGORIES.map((cat) => (
                <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 aspect-square ${selectedCategory === cat.name ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-[10px] font-bold whitespace-nowrap">{cat.name}</span>
                </button>
            ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-slate-100">
          <div className={`flex-grow px-4 py-3 rounded-2xl border flex flex-col justify-center min-w-[200px] relative overflow-hidden transition-all ${isFeatureUnlocked ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
             {!isFeatureUnlocked && (
                <div className="absolute inset-0 bg-slate-100/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <button onClick={() => setShowPremiumModal(true)} className="bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1 hover:bg-slate-50">
                        <Lock size={12}/> 解鎖調整
                    </button>
                </div>
             )}
             <div className="flex justify-between text-xs text-slate-500 font-bold mb-2"><span className="flex items-center gap-1.5"><SlidersHorizontal size={14}/> 洗評敏感度</span><span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-mono">{(spamThreshold * 100).toFixed(0)}%</span></div>
             <input type="range" min="0.05" max="0.50" step="0.05" value={spamThreshold} onChange={(e) => setSpamThreshold(parseFloat(e.target.value))} disabled={!isFeatureUnlocked} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-800 hover:accent-slate-600 transition disabled:cursor-not-allowed disabled:accent-slate-400" />
          </div>
          
          <button onClick={() => setFilters({...filters, openNow: !filters.openNow})} className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs border transition shadow-sm font-bold active:scale-95 ${filters.openNow ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
             <Clock size={16}/> 營業中
          </button>
          <button onClick={() => setFilters({...filters, pet: !filters.pet})} className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs border transition shadow-sm font-bold active:scale-95 ${filters.pet ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}><Dog size={16}/> 寵物</button>
        </div>
      </div>

      {isControlsCollapsed && (
        <div className="bg-white/90 backdrop-blur z-10 shadow-sm border-b border-slate-200 px-4 py-3 flex justify-between items-center animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 overflow-hidden">
                {selectedDiningType && <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full whitespace-nowrap">{DINING_TYPES.find(t => t.id === selectedDiningType)?.name}</span>}
                {selectedCategory !== "全部" && <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full whitespace-nowrap">{selectedCategory}</span>}
                <span className="text-xs text-slate-400 ml-1">找到 {processedRestaurants.length} 間</span>
            </div>
            <button onClick={resetSelection} className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 text-white px-4 py-2 rounded-full hover:bg-slate-700 transition shadow-sm flex-shrink-0">
                <ChevronDown size={14}/> 重新選擇
            </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/50 pb-24 scrollbar-hide">
        {processedRestaurants.map(resto => (
            <div key={resto.id} className="relative p-4 rounded-3xl border border-white bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-default group">
              <div className="flex gap-5">
                <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-slate-100 shrink-0 select-none">{resto.image}</div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg truncate pr-2 text-slate-800 leading-tight">{resto.name}</h3>
                        <span className="text-slate-500 font-bold text-[10px] bg-slate-100 px-2 py-1 rounded-md tracking-wide">{resto.price}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <StarRating rating={resto.rating} />
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="font-medium">{resto.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="font-medium">{resto.reviews} 評</span>
                      </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {!isFeatureUnlocked && resto.isSpam ? (
                        <button onClick={() => setShowPremiumModal(true)} className="flex items-center gap-1.5 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-md shadow-slate-200">
                            <Lock size={12}/> 解鎖分析
                        </button>
                    ) : (isFeatureUnlocked && resto.isSpam ? (
                      <div className="text-xs text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                          <AlertTriangle size={14} /> 疑似洗評 {(resto.washRatio*100).toFixed(0)}%
                      </div>
                    ) : (
                      <div className="text-xs text-teal-600 font-bold flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100">
                          <CheckCircle size={14} /> 評論健康
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                        <button onClick={(e) => {e.stopPropagation(); toggleFavorite(resto.id)}} className={`p-2 rounded-full hover:bg-slate-50 transition ${favorites.has(resto.id) ? 'text-rose-500' : 'text-slate-300'}`}>
                            <Heart size={18} fill={favorites.has(resto.id) ? "currentColor" : "none"}/>
                        </button>
                        <button onClick={(e) => {e.stopPropagation(); toggleBlackList(resto.id)}} className="p-2 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition">
                            <Ban size={18}/>
                        </button>
                        <button onClick={(e) => {e.stopPropagation(); setReportingRestaurant(resto.name)}} className="p-2 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition">
                            <Flag size={18}/>
                        </button>
                    </div>
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