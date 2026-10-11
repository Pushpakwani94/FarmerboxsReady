import React, { useState, useEffect } from 'react';
import { X, Users, Key, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AddJoinerModal: React.FC = () => {
  const { isAddJoinerOpen, setIsAddJoinerOpen, addJoiner, zones } = useApp();

  const [name, setName] = useState('');
  const [zone, setZone] = useState('Kharadi');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('FarmerBox@123');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (zones.length > 0) {
      if (!zone || !zones.some(z => z.name === zone)) {
        setZone(zones[0].name);
      }
    }
  }, [zones]);

  if (!isAddJoinerOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please enter joiner name and phone number.');
      return;
    }
    const cleanZone = zone || (zones[0]?.name || 'Kharadi');
    const cleanEmail = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@farmerbox.in`;
    const cleanPassword = password.trim() || 'FarmerBox@123';

    addJoiner(
      name.trim(),
      phone.trim(),
      cleanZone,
      cleanEmail,
      'Active',
      cleanPassword
    );
    setIsAddJoinerOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setPassword('FarmerBox@123');
  };

  const handleGeneratePassword = () => {
    const randomPass = `FB@${Math.floor(1000 + Math.random() * 9000)}`;
    setPassword(randomPass);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Add New Joiner</h3>
              <p className="text-xs text-slate-500">Onboard a new field joiner & generate mobile app login</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddJoinerOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Deshmukh"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Zone</label>
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-slate-700"
            >
              {Array.from(new Set([...zones.map(z => z.name), 'Kharadi', 'Shivajinagar', 'Viman Nagar', 'Hinjawadi', 'Baner', 'Hadapsar', 'Aundh', 'Kothrud', 'Wakad', 'Magarpatta', 'Pimple Saudagar', 'Pimple Chinchwad'])).map(zoneName => (
                <option key={zoneName} value={zoneName}>{zoneName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number (Login ID) *</label>
              <input
                type="text"
                required
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="joiner@farmerbox.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Dummy Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                <span>App Login Password *</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Generate PIN
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="FarmerBox@123"
                className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              Default password: <span className="font-mono font-bold text-slate-700">FarmerBox@123</span> (Used by the joiner to sign in to the Hotel Joiner App).
            </p>
          </div>

          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-emerald-800 font-medium text-[11px]">
            💡 <strong>Joiner Commission Rule:</strong> Earns ₹100 flat commission per completed order delivered to onboarded hotels.
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddJoinerOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
            >
              Add Joiner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
