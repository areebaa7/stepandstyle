'use client';

import { useState } from 'react';
import { Share2, Globe, Send, MessageSquare, Copy, Check, Zap } from 'lucide-react';

export default function AdminLeadGeneratorPanel() {
  const [platform, setPlatform] = useState<'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'TIKTOK'>('INSTAGRAM');
  const [productTopic, setProductTopic] = useState('New Bridal Heels Collection');
  const [discountTopic, setDiscountTopic] = useState('Flat 30% Off This Weekend');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateLeadContent = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedCaption(
        `✨ Elevate your bridal look with Step & Styl's latest arrival: ${productTopic}! 👠\n\n🎉 Limited Time Offer: ${discountTopic}.\n\n👇 Order directly via DM or tap the link in bio to shop now!\n💬 WhatsApp Orders: +92 300 1234567\n\n#StepAndStyl #BridalHeels #FootwearPakistan #Fashion #Sale #StyleInspiration`
      );
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 via-purple-700 to-indigo-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold uppercase tracking-wider">
              <Share2 className="w-3.5 h-3.5 text-yellow-300" />
              Social Media Lead Generator
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Social Media Multi-Platform Lead Engine</h2>
            <p className="text-white/80 text-sm max-w-xl">
              Create AI-optimized posts, captions, hashtags, and direct lead generation links for Instagram, Facebook, WhatsApp, and TikTok.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generator Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Lead Campaign Generator
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Select Platform
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'INSTAGRAM', label: 'Instagram', icon: Globe },
                  { id: 'FACEBOOK', label: 'Facebook', icon: MessageSquare },
                  { id: 'WHATSAPP', label: 'WhatsApp', icon: Send },
                  { id: 'TIKTOK', label: 'TikTok', icon: Share2 },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPlatform(item.id as any)}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      platform === item.id
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Target Product / Collection
              </label>
              <input
                type="text"
                value={productTopic}
                onChange={(e) => setProductTopic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-purple-600"
                placeholder="e.g. Handmade Chappal Series"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Special Offer / Hook
              </label>
              <input
                type="text"
                value={discountTopic}
                onChange={(e) => setDiscountTopic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-purple-600"
                placeholder="e.g. Free Delivery Nationwide"
              />
            </div>

            <button
              onClick={handleGenerateLeadContent}
              disabled={generating}
              className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-widest transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              {generating ? 'Generating High-Converting Lead Content...' : 'Generate Campaign & Lead Post'}
            </button>
          </div>
        </div>

        {/* Output & Lead Tracking preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
                Generated Caption & Lead Trigger
              </h3>
              {generatedCaption && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Caption'}
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 min-h-[160px] text-xs leading-relaxed font-mono text-gray-800 whitespace-pre-wrap">
              {generatedCaption || 'Click "Generate Campaign" to produce AI social media captions & lead generator links...'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 text-purple-900 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider">Social Leads Captured (30d)</div>
              <div className="text-3xl font-black">1,420</div>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 text-emerald-900 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider">Lead Conversion Rate</div>
              <div className="text-3xl font-black">24.5%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
