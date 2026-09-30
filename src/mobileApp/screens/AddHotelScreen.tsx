import React, { useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2 } from 'lucide-react';
import { useJoinerApp } from '../JoinerAppContext';

export const AddHotelScreen: React.FC = () => {
  const { setCurrentScreen, addHotel } = useJoinerApp();

  const [hotelName, setHotelName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');
  const [gst, setGst] = useState('');
  const [fssai, setFssai] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const zonesList = [
    'Kharadi',
    'Viman Nagar',
    'Hinjawadi',
    'Magarpatta',
    'Hadapsar',
    'Baner',
    'Wakad',
    'Aundh',
    'Shivajinagar',
    'Undri',
    'Kothrud'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelName || !ownerName || !mobile || !address || !zone) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await addHotel({
        name: hotelName,
        ownerName: ownerName,
        contactPerson: ownerName,
        mobile: mobile,
        phone: mobile,
        address,
        zone,
        gst,
        fssai,
        orders: 0,
        status: 'Active',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'
      });

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setCurrentScreen('MY_HOTELS');
      }, 1200);
    } catch (err: any) {
      alert(err?.message || 'Failed to add hotel. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
        <button
          onClick={() => setCurrentScreen('MY_HOTELS')}
          className="p-1 -ml-1 text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-extrabold text-slate-900">Add New Hotel</h2>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isSubmitted ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Hotel Added Successfully!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {hotelName} has been added to your partner account. You can now start placing daily vegetable orders.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {/* Hotel Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Hotel Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter hotel name"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600"
              />
            </div>

            {/* Owner / Manager Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Owner / Manager Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter owner/manager name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-emerald-600">
                <span className="px-3 py-2 bg-slate-50 text-slate-500 font-semibold border-r border-slate-200 text-xs">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600"
              />
            </div>

            {/* Zone */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Zone <span className="text-rose-500">*</span>
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-emerald-600"
              >
                <option value="">Select zone</option>
                {zonesList.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* GST Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                GST Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Enter GST number"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600"
              />
            </div>

            {/* FSSAI Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                FSSAI Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Enter FSSAI number"
                value={fssai}
                onChange={(e) => setFssai(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600"
              />
            </div>

            {/* Hotel Image Upload */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Hotel Image <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors">
                <Camera className="w-6 h-6 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">Upload Hotel Image</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Submit for Approval
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
