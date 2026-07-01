import { useState, useEffect } from 'react';
import { getProfiles, getCurrentProfile, setCurrentProfile, createProfile, checkPin } from './lib/storage';
import TabBar from './components/TabBar';
import Discover from './tabs/Discover';
import Beans from './tabs/Beans';
import Brew from './tabs/Brew';
import Train from './tabs/Train';
import Me from './tabs/Me';
import SetupScreen from './components/SetupScreen';
import ProfilePicker from './components/ProfilePicker';
import PinScreen from './components/PinScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('brew');
  const [profile, setProfile]     = useState(null);
  const [screen, setScreen]       = useState('loading'); // loading | setup | pick | pin | app

  useEffect(() => {
    const profiles = getProfiles();
    if (profiles.length === 0) {
      setScreen('setup');
    } else if (profiles.length === 1) {
      const p = profiles[0];
      if (p.pin_hash) {
        setScreen('pin');
      } else {
        setCurrentProfile(p.id);
        setProfile(p);
        setScreen('app');
      }
    } else {
      setScreen('pick');
    }
  }, []);

  function handleSetupDone(newProfile) {
    setCurrentProfile(newProfile.id);
    setProfile(newProfile);
    setScreen('app');
  }

  function handleProfilePicked(p) {
    if (p.pin_hash) {
      setProfile(p);
      setScreen('pin');
    } else {
      setCurrentProfile(p.id);
      setProfile(p);
      setScreen('app');
    }
  }

  function handlePinSuccess() {
    setCurrentProfile(profile.id);
    setScreen('app');
  }

  function handleProfileUpdate(updatedProfile) {
    setProfile(updatedProfile);
  }

  function handleSwitchProfile() {
    const profiles = getProfiles();
    if (profiles.length === 0) {
      setScreen('setup');
    } else if (profiles.length === 1) {
      const p = profiles[0];
      if (p.pin_hash) {
        setProfile(p);
        setScreen('pin');
      } else {
        setCurrentProfile(p.id);
        setProfile(p);
        setScreen('app');
      }
    } else {
      setScreen('pick');
    }
  }

  if (screen === 'loading') return null;

  if (screen === 'setup') {
    return <SetupScreen onDone={handleSetupDone} onBack={() => setScreen('pick')} />;
  }

  if (screen === 'pick') {
    return <ProfilePicker onPick={handleProfilePicked} onNew={() => setScreen('setup')} />;
  }

  if (screen === 'pin') {
    return (
      <PinScreen
        profile={profile}
        onSuccess={handlePinSuccess}
        onCancel={() => setScreen('pick')}
      />
    );
  }

  const tabs = {
    discover: <Discover profile={profile} />,
    beans:    <Beans profile={profile} />,
    brew:     <Brew profile={profile} onUpdate={handleProfileUpdate} onSessionLogged={() => setProfile({ ...profile })} />,
    train:    <Train />,
    me:       <Me profile={profile} onUpdate={handleProfileUpdate} onSwitch={handleSwitchProfile} />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tabs[activeTab]}
      </div>
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
