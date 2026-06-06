import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setAuthStatus, updateProfile } from '../../features/auth/authSlice';
import { SparkIcon } from '../../components/ui/Icons';

const OB_SUBJECTS = ['Biology','Chemistry','Physics','Psychology','Computer Science','Mathematics','History','Literature','Economics','Engineering','Medicine','Law'];
const OB_STYLES = ['Visual learner','Reading and writing','Audio and lectures','A mix of everything'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const { profile } = useAppSelector(state => state.auth);
  const userName = profile?.name || '';
  const [dName, setDName] = useState(userName);
  const [subs, setSubs] = useState<string[]>([]);
  const [sty, setSty] = useState('');
  const total = 4;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const togSub = (s: string) => setSubs(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s]);
  const canGo = step===0 ? dName.trim().length>0 : step===1 ? subs.length>0 : step===2 ? sty!=='' : true;
  
  const finish = () => {
    dispatch(updateProfile({ ...profile, name: dName.trim()||userName, subjects: subs, style: sty }));
    dispatch(setAuthStatus('app'));
    navigate('/dashboard');
  };
  const next = () => { if(step<total-1) setStep(step+1); else finish(); };

  const renderStep = () => {
    if (step === 0) return (
      <div className="onboard-step" key="s0">
        <div className="auth-spark" style={{marginBottom:20}}><SparkIcon size={52}/></div>
        <h1>Welcome to Kawe</h1>
        <p className="ob-sub">Let's personalise your study companion. What should we call you?</p>
        <input className="ob-input" value={dName} onChange={e=>setDName(e.target.value)} placeholder="Your name" autoFocus onKeyDown={e=>{if(e.key==='Enter'&&canGo)next()}}/>
        <br/><button className="ob-btn" disabled={!canGo} onClick={next}>Continue</button>
      </div>
    );
    if (step === 1) return (
      <div className="onboard-step" key="s1">
        <h1>What do you study?</h1>
        <p className="ob-sub">Pick the subjects you're working on right now.</p>
        <div className="ob-chips">{OB_SUBJECTS.map(s=><button key={s} className={`ob-chip${subs.includes(s)?' selected':''}`} onClick={()=>togSub(s)}>{s}</button>)}</div>
        <button className="ob-btn" disabled={!canGo} onClick={next}>Continue</button>
      </div>
    );
    if (step === 2) return (
      <div className="onboard-step" key="s2">
        <h1>How do you learn best?</h1>
        <p className="ob-sub">We'll tailor your experience to match your style.</p>
        <div className="ob-chips">{OB_STYLES.map(s=><button key={s} className={`ob-chip${sty===s?' selected':''}`} onClick={()=>setSty(s)}>{s}</button>)}</div>
        <button className="ob-btn" disabled={!canGo} onClick={next}>Continue</button>
      </div>
    );
    return (
      <div className="onboard-step" key="s3">
        <div className="ob-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h1>You're all set, {dName||'friend'}!</h1>
        <p className="ob-sub">Upload your materials, and let Kawe fuse everything into one clear study experience.</p>
        <button className="ob-btn" onClick={finish}>Start studying</button>
      </div>
    );
  };

  return (
    <div className="onboard-page">
      <div className="onboard-top">
        <div className="onboard-dots">{Array.from({length:total},(_,i)=><div key={i} className={`onboard-dot${i===step?' active':i<step?' done':''}`}/>)}</div>
        {step<total-1 && <button className="onboard-skip" onClick={finish}>Skip</button>}
      </div>
      <div className="onboard-body">{renderStep()}</div>
    </div>
  );
}
