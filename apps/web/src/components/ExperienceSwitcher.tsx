import { PanelsTopLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { availableExperiences, currentExperience, currentExperiencePath } from '../auth/experiences';

export function ExperienceSwitcher() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user) return null;
  const experiences = availableExperiences(user);
  const current=currentExperience(location.pathname,experiences);
  if(!current)return null;
  if(experiences.length<2)return null;
  return <label className="experience-switcher"><PanelsTopLeft aria-hidden="true" /><span className="sr-only">Current workspace</span><select aria-label="Switch workspace" value={currentExperiencePath(location.pathname, experiences)} onChange={(event) => navigate(event.target.value)}>{experiences.map((experience) => <option key={experience.key} value={experience.path}>{experience.label}</option>)}</select></label>;
}
