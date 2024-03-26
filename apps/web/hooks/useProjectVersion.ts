import { useMemo } from 'react';

import pack from '../package.json';

const useProjectVersion = () => {
  const appVersion = useMemo(() => {
    return pack.version;
  }, []);

  return appVersion;
};

export default useProjectVersion;
