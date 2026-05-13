"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Phone, Lightbulb } from "lucide-react";

export function ServicesTab() {
  const [activeTab, setActiveTab] = useState("data");

  const services = [
    { id: "data", icon: <Wifi />, label: "Data" },
    { id: "airtime", icon: <Phone />, label: "Airtime" },
    { id: "bills", icon: <Lightbulb />, label: "Bills" },
  ];

  const dataPlans = [
    { id: 1, network: "MTN", plan: "1GB", price: "₦250", validity: "30 Days" },
    { id: 2, network: "Airtel", plan: "2GB", price: "₦500", validity: "30 Days" },
    { id: 3, network: "Glo", plan: "5GB", price: "₦1,200", validity: "30 Days" },
  ];

  const airtimeOffers = [
    { id: 1, network: "MTN", discount: "3% OFF", min: "₦100" },
    { id: 2, network: "Airtel", discount: "2% OFF", min: "₦100" },
    { id: 3, network: "9mobile", discount: "4% OFF", min: "₦100" },
  ];

  const billProviders = [
    { id: 1, name: "Ikeja Electric", type: "Utility", fee: "₦0" },
    { id: 2, name: "DSTV", type: "Cable TV", fee: "₦100" },
    { id: 3, name: "GOTV", type: "Cable TV", fee: "₦100" },
  ];

  return (
    <section className="py-20 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Our Services</h2>
        <p className="text-brand-silver/60">Choose a service to preview our elite rates</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-12 gap-2 md:gap-4 p-1 bg-brand-midnight/40 backdrop-blur-xl border border-brand-royal/20 rounded-2xl w-fit mx-auto">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => setActiveTab(service.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === service.id
                ? "bg-brand-royal text-white shadow-[0_0_20px_rgba(26,79,219,0.4)]"
                : "text-brand-silver/50 hover:text-brand-silver hover:bg-brand-royal/10"
            }`}
          >
            {service.icon}
            <span className="hidden md:inline">{service.label}</span>
          </button>
        ))}
      </div>

      {/* Preview Content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "data" && (
            <motion.div
              key="data"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {dataPlans.map((plan) => (
                <div key={plan.id} className="p-6 rounded-2xl bg-brand-midnight/60 border border-brand-cyan/20 backdrop-blur-md hover:border-brand-cyan transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-brand-cyan uppercase tracking-widest">{plan.network}</span>
                    <span className="text-2xl font-bold text-white">{plan.price}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">{plan.plan}</h4>
                  <p className="text-brand-silver/50 text-sm mb-6">{plan.validity}</p>
                  <button className="w-full py-3 rounded-xl border border-brand-cyan/30 text-brand-cyan font-bold group-hover:bg-brand-cyan group-hover:text-brand-midnight transition-all">
                    Purchase Now
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "airtime" && (
            <motion.div
              key="airtime"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {airtimeOffers.map((offer) => (
                <div key={offer.id} className="p-6 rounded-2xl bg-brand-midnight/60 border border-brand-gold/20 backdrop-blur-md hover:border-brand-gold transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-brand-gold uppercase tracking-widest">{offer.network}</span>
                    <span className="text-xl font-bold text-brand-gold">{offer.discount}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">Instant Top-up</h4>
                  <p className="text-brand-silver/50 text-sm mb-6">Min order: {offer.min}</p>
                  <button className="w-full py-3 rounded-xl border border-brand-gold/30 text-brand-gold font-bold group-hover:bg-brand-gold group-hover:text-brand-midnight transition-all">
                    Recharge Now
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "bills" && (
            <motion.div
              key="bills"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {billProviders.map((provider) => (
                <div key={provider.id} className="p-6 rounded-2xl bg-brand-midnight/60 border border-brand-royal/20 backdrop-blur-md hover:border-brand-royal transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-brand-royal uppercase tracking-widest">{provider.type}</span>
                    <span className="text-sm font-bold text-white">Service Fee: {provider.fee}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-6">{provider.name}</h4>
                  <button className="w-full py-3 rounded-xl border border-brand-royal/30 text-brand-royal font-bold group-hover:bg-brand-royal group-hover:text-white transition-all">
                    Pay Now
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
