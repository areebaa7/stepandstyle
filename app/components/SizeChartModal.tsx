'use client';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIZE_DATA = [
  { eu: '35', us: '5', uk: '3', cm: '22.5' },
  { eu: '36', us: '6', uk: '4', cm: '23.0' },
  { eu: '37', us: '7', uk: '5', cm: '23.5' },
  { eu: '38', us: '8', uk: '6', cm: '24.5' },
  { eu: '39', us: '9', uk: '7', cm: '25.0' },
  { eu: '40', us: '10', uk: '8', cm: '25.5' },
  { eu: '41', us: '11', uk: '9', cm: '26.0' },
  { eu: '42', us: '12', uk: '10', cm: '27.0' },
];

export default function SizeChartModal({ isOpen, onClose }: SizeChartModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[85vh] border border-gray-100">
        {/* Header - Sticky */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Size guide</h2>
            <p className="text-xs font-bold text-purple-600  tracking-wide mt-1">Footwear collection</p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close size guide"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
          <div className="space-y-8">
            {/* Table Section */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-4 py-3.5 text-xs font-semibold text-gray-400  tracking-wide">EU</th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-gray-400  tracking-wide">US</th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-gray-400  tracking-wide">UK</th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-gray-400  tracking-wide">CM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {SIZE_DATA.map((row, index) => (
                    <tr key={index} className="hover:bg-purple-50/30 transition-colors group">
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{row.eu}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 group-hover:text-purple-600 transition-colors">{row.us}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 group-hover:text-purple-600 transition-colors">{row.uk}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{row.cm}<span className="text-xs ml-0.5 text-gray-400">cm</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Measuring Guide */}
            <div className="p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-[24px] border border-purple-100/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-20 h-20 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h1m-1 4h1m-1 4h1m3-12h3c.552 0 1 .448 1 1v14c0 .552-.448 1-1 1h-3m-6 0H6c-.552 0-1-.448-1-1V5c0-.552.448-1 1-1h3m0 0v16" />
                </svg>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
                <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Find Your Measure
              </h3>
              
              <div className="space-y-4 relative z-10">
                {[
                  "Place your foot on a blank sheet of paper.",
                  "Mark the tip of your longest toe and the back of your heel.",
                  "Measure the distance between marks and find your size."
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white border border-purple-100 flex items-center justify-center text-xs font-semibold text-purple-600 shadow-sm">
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="p-6 bg-white border-t border-gray-100 sticky bottom-0 z-10">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-[0.98]"
          >
            I UNDERSTAND
          </button>
        </div>
      </div>

    </div>
  );
}
