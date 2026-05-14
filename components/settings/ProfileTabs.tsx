'use client'

import { useState } from 'react'
import PartnerSecretTab from './PartnerSecretTab'
import MyInfoTab from './MyInfoTab'
import ReminderTab from './ReminderTab'

export default function ProfileTabs({ partnerData, profileData, isCreator }: { partnerData: any, profileData: any, isCreator: boolean }) {
  const [activeTab, setActiveTab] = useState<'partner' | 'me' | 'reminders'>('partner')

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex border-b border-border bg-secondary/10 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('partner')}
          className={`flex-1 min-w-[140px] py-4 text-sm font-bold transition-all relative ${
            activeTab === 'partner' 
              ? 'text-primary' 
              : 'text-foreground/50 hover:text-foreground/80 hover:bg-secondary/20'
          }`}
        >
          Bí mật người ấy
          {activeTab === 'partner' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-t-full shadow-[0_-2px_10px_rgba(244,63,94,0.5)]" />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('me')}
          className={`flex-1 min-w-[140px] py-4 text-sm font-bold transition-all relative ${
            activeTab === 'me' 
              ? 'text-primary' 
              : 'text-foreground/50 hover:text-foreground/80 hover:bg-secondary/20'
          }`}
        >
          Thông tin của mình
          {activeTab === 'me' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-t-full shadow-[0_-2px_10px_rgba(244,63,94,0.5)]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex-1 min-w-[140px] py-4 text-sm font-bold transition-all relative ${
            activeTab === 'reminders' 
              ? 'text-primary' 
              : 'text-foreground/50 hover:text-foreground/80 hover:bg-secondary/20'
          }`}
        >
          Lời nhắc
          {activeTab === 'reminders' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-t-full shadow-[0_-2px_10px_rgba(244,63,94,0.5)]" />
          )}
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'partner' && <PartnerSecretTab partnerData={partnerData} isCreator={isCreator} />}
        {activeTab === 'me' && <MyInfoTab profileData={profileData} />}
        {activeTab === 'reminders' && <ReminderTab />}
      </div>
    </div>
  )
}
