import { GraduateProfile } from '../../../components/GraduateProfile';

// Before sign up: photo, name and job only. The full story opens once they create an account.
export default function PublicStory() {
  return <GraduateProfile locked />;
}
