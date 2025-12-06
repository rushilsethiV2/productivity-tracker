import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getAllYearData,
  getCurrentYear,
  getYearData,
  listYearKeys,
  saveYearData,
  clearYear,
  type YearStorageData,
} from '../utils/yearStorage';

type ViewMode = 'summary' | 'json';
type AuthTab = 'local' | 'dropbox';

type DropboxStatus = 'disconnected' | 'authorizing' | 'connected' | 'error';

const DROPBOX_CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID as string | undefined;
const DROPBOX_TOKEN_KEY = 'dropbox_access_token';
const DROPBOX_CODE_VERIFIER_KEY = 'dropbox_code_verifier';
const DROPBOX_FOLDER_PATH = '/flow-state';

function getDropboxYearPath(year: string): string {
  return `${DROPBOX_FOLDER_PATH}/${year}.json`;
}

interface AppDataGroup {
  app: string;
  containers: Array<{
    name: string;
    type: string;
    count: number;
    details?: string;
    key: string;
    value: any;
  }>;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-[rgb(var(--border))] text-gray-300 hover:bg-[rgb(var(--background))] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function organizeDataByApp(data: YearStorageData): AppDataGroup[] {
  const appGroups: Record<string, AppDataGroup> = {};

  Object.entries(data).forEach(([key, value]) => {
    let app = 'Other';
    let containerName = key;

    // Categorize by app
    if (key.startsWith('app_')) {
      if (key.includes('todo')) app = 'Todos';
      else if (key.includes('habit')) app = 'Habits';
      else if (key.includes('note')) app = 'Notes';
      else app = 'App Data';
    } else if (key.includes('workout') || key.includes('routine') || key.includes('session')) {
      app = 'Exercise';
    } else if (key === 'rest_days') {
      app = 'Exercise';
      containerName = 'Rest Days';
    } else if (key === 'workout_reset_time') {
      app = 'Exercise';
      containerName = 'Workout Reset';
    }

    if (!appGroups[app]) {
      appGroups[app] = { app, containers: [] };
    }

    let count = 0;
    let details = '';

    if (key === 'rest_days' && value && typeof value === 'object') {
      const dates = Object.keys(value);
      count = dates.length;
      details = `${dates.length} day${dates.length === 1 ? '' : 's'} marked`;
    } else if (Array.isArray(value)) {
      count = value.length;
      details = `${value.length} item${value.length === 1 ? '' : 's'}`;
    } else if (value && typeof value === 'object') {
      count = Object.keys(value).length;
      details = `${count} field${count === 1 ? '' : 's'}`;
    } else {
      count = 1;
      details = String(value);
    }

    appGroups[app].containers.push({
      name: containerName,
      type: Array.isArray(value) ? 'array' : typeof value,
      count,
      details,
      key,
      value,
    });
  });

  return Object.values(appGroups).map(group => ({
    ...group,
    containers: group.containers.sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

function getStoredDropboxToken(): string | null {
  try {
    return localStorage.getItem(DROPBOX_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredDropboxToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(DROPBOX_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(DROPBOX_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function generateCodeVerifier(length = 64): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(x => chars[x % chars.length])
    .join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier);
  return base64UrlEncode(hash);
}

function getRedirectUri(): string {
  return `${window.location.origin}/auth`;
}

export default function DataManagerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [yearData, setYearData] = useState<YearStorageData>({});
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [editorValue, setEditorValue] = useState('');
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthTab>('local');

  const [dropboxStatus, setDropboxStatus] = useState<DropboxStatus>('disconnected');
  const [dropboxError, setDropboxError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dropboxYears, setDropboxYears] = useState<string[]>([]);
  const [isLoadingDropboxYears, setIsLoadingDropboxYears] = useState(false);
  const [dropboxUser, setDropboxUser] = useState<{ name: string; email: string } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(new Set());
  const [callbackProcessed, setCallbackProcessed] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const hasData = Object.keys(yearData).length > 0;
  const appGroups: AppDataGroup[] = useMemo(
    () => organizeDataByApp(yearData),
    [yearData]
  );

  const loadYears = () => {
    const allYears = listYearKeys();
    // Ensure current year is always visible, even if empty
    const thisYear = getCurrentYear();
    const unique = Array.from(new Set([...allYears, thisYear])).sort();
    setYears(unique);
    if (!selectedYear) {
      setSelectedYear(thisYear);
    }
  };

  const loadYear = (year: string | null) => {
    if (!year) return;
    const data = getYearData(year);
    setYearData(data);
    setEditorValue(JSON.stringify(data, null, 2));
    setEditorError(null);
  };

  useEffect(() => {
    loadYears();

    const token = getStoredDropboxToken();
    if (token) {
      // Only check token validity if we're restoring a session (not right after login)
      // Check if we just logged in by looking for the code in URL params
      const hasCallbackCode = searchParams.get('code');
      if (!hasCallbackCode) {
        // No callback code, so this is a session restore - validate token
        checkTokenValidity(token).then(isValid => {
          if (isValid) {
            setDropboxStatus('connected');
            void loadDropboxYears();
            void loadDropboxUserInfo(true); // Validate on restore
            loadLastSyncTime();
          } else {
            // Token is invalid, disconnect
            setStoredDropboxToken(null);
            setDropboxStatus('disconnected');
          }
        }).catch(() => {
          // On error, assume token might be valid and try anyway
          setDropboxStatus('connected');
          void loadDropboxYears();
          void loadDropboxUserInfo(true); // Validate on restore
          loadLastSyncTime();
        });
      } else {
        // We have a callback code, so login is in progress - don't validate yet
        // The handleDropboxCallback will handle setting the status
      }
    }
  }, []);

  const checkTokenValidity = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 400) {
          // Token is invalid or expired
          return false;
        }
      }
      return response.ok;
    } catch {
      return false;
    }
  };

  const loadDropboxUserInfo = async (validateToken: boolean = true) => {
    const token = getStoredDropboxToken();
    if (!token) return;

    try {
      const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as {
          name?: { display_name?: string };
          email?: string;
        };
        if (data.name?.display_name && data.email) {
          setDropboxUser({
            name: data.name.display_name,
            email: data.email,
          });
        }
      } else if (response.status === 401 || response.status === 400) {
        // Only disconnect if we're validating (not right after login)
        if (validateToken) {
          try {
            // Check if it's really invalid or just a temporary error
            const errorText = await response.text();
            // If error mentions "expired" or "invalid", disconnect
            if (errorText.includes('expired') || errorText.includes('invalid') || errorText.includes('expired_access_token') || errorText.includes('invalid_access_token')) {
              setStoredDropboxToken(null);
              setDropboxStatus('disconnected');
              setDropboxUser(null);
              setDropboxError('Dropbox session expired. Please reconnect.');
              toast.error('Dropbox session expired. Please reconnect.');
            } else {
              // Might be a temporary error, just log it
              console.warn('Dropbox API error (non-critical):', errorText);
            }
          } catch {
            // Can't read error text, assume it's a critical error if validating
            setStoredDropboxToken(null);
            setDropboxStatus('disconnected');
            setDropboxUser(null);
            setDropboxError('Dropbox session expired. Please reconnect.');
            toast.error('Dropbox session expired. Please reconnect.');
          }
        } else {
          // Right after login, don't disconnect on first error - might be temporary
          // Just log it silently
          console.warn('Dropbox API error after login (ignoring):', response.status);
        }
      }
    } catch (error) {
      // Ignore network errors
      if (validateToken) {
        console.error('Error loading Dropbox user info:', error);
      }
    }
  };

  const loadLastSyncTime = () => {
    try {
      const stored = localStorage.getItem('dropbox_last_sync');
      if (stored) {
        setLastSyncTime(new Date(stored));
      }
    } catch {
      // Ignore
    }
  };

  const updateLastSyncTime = () => {
    const now = new Date();
    setLastSyncTime(now);
    try {
      localStorage.setItem('dropbox_last_sync', now.toISOString());
    } catch {
      // Ignore
    }
  };

  const loadDropboxYears = async () => {
    const token = getStoredDropboxToken();
    if (!token) return;

    setIsLoadingDropboxYears(true);
    try {
      const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: DROPBOX_FOLDER_PATH,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          // Folder doesn't exist yet, that's okay
          setDropboxYears([]);
          return;
        }
        if (response.status === 401 || response.status === 400) {
          // Token is invalid or expired
          const isValid = await checkTokenValidity(token);
          if (!isValid) {
            setStoredDropboxToken(null);
            setDropboxStatus('disconnected');
            setDropboxError('Dropbox session expired. Please reconnect.');
            toast.error('Dropbox session expired. Please reconnect.');
            return;
          }
        }
        throw new Error(`Failed to list folder: ${response.statusText}`);
      }

      const data = (await response.json()) as { entries?: Array<{ name: string }> };
      const yearFiles =
        data.entries
          ?.filter(entry => entry.name.endsWith('.json'))
          .map(entry => entry.name.replace('.json', ''))
          .filter(year => /^\d{4}$/.test(year))
          .sort() || [];
      setDropboxYears(yearFiles);
    } catch (e) {
      console.error('Failed to load Dropbox years:', e);
      toast.error('Failed to load Dropbox files');
    } finally {
      setIsLoadingDropboxYears(false);
    }
  };

  useEffect(() => {
    if (selectedYear) {
      loadYear(selectedYear);
    }
  }, [selectedYear]);

  const handleRefreshAll = () => {
    setYears([]);
    setSelectedYear(null);
    const all = getAllYearData();
    const keys = Object.keys(all).sort();
    const thisYear = getCurrentYear();
    const unique = Array.from(new Set([...keys, thisYear])).sort();
    setYears(unique);
    const target = selectedYear || thisYear;
    setSelectedYear(target);
    loadYear(target);
  };

  const handleChangeYear = (year: string) => {
    setSelectedYear(year);
  };

  const handleEditorChange = (value: string) => {
    setEditorValue(value);
    setEditorError(null);
  };

  const handleSaveJson = () => {
    if (!selectedYear) return;
    setIsSaving(true);
    try {
      const parsed = editorValue.trim() ? JSON.parse(editorValue) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        saveYearData(selectedYear, parsed as YearStorageData);
        setYearData(parsed as YearStorageData);
        setEditorError(null);
        toast.success(`Year ${selectedYear} data saved successfully`);
      } else {
        const errorMsg = 'Root value must be a JSON object (e.g., { "app_todos": [...] })';
        setEditorError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Invalid JSON: ' + (error instanceof Error ? error.message : String(error));
      setEditorError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearYear = () => {
    if (!selectedYear) return;
    setModalState({
      isOpen: true,
      title: 'Clear Year Data',
      message: `Clear all data for year ${selectedYear}? This cannot be undone.`,
      confirmText: 'Clear',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        clearYear(selectedYear);
        loadYear(selectedYear);
        toast.success(`Year ${selectedYear} data cleared successfully`);
        setModalState(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const toggleContainer = (containerKey: string) => {
    setExpandedContainers(prev => {
      const next = new Set(prev);
      if (next.has(containerKey)) {
        next.delete(containerKey);
      } else {
        next.add(containerKey);
      }
      return next;
    });
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
  };

  const startDropboxLogin = async () => {
    if (!DROPBOX_CLIENT_ID) {
      setDropboxError('Dropbox client ID is not configured (VITE_DROPBOX_CLIENT_ID).');
      return;
    }

    setDropboxError(null);
    setDropboxStatus('authorizing');

    const verifier = generateCodeVerifier();
    const challenge = await createCodeChallenge(verifier);

    try {
      sessionStorage.setItem(DROPBOX_CODE_VERIFIER_KEY, verifier);
    } catch {
      // ignore
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: DROPBOX_CLIENT_ID,
      redirect_uri: getRedirectUri(),
      code_challenge: challenge,
      code_challenge_method: 'S256',
      token_access_type: 'offline',
    });

    window.location.href = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
  };

  const handleDropboxCallback = async () => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    if (!code && !error) return;

    // Prevent processing the same callback twice
    if (callbackProcessed) return;
    setCallbackProcessed(true);

    if (error) {
      setDropboxStatus('error');
      setDropboxError(
        'Dropbox authorization failed. Please try again from the Dropbox tab.'
      );
      searchParams.delete('error');
      searchParams.delete('state');
      setSearchParams(searchParams, { replace: true });
      return;
    }

    const verifier = sessionStorage.getItem(DROPBOX_CODE_VERIFIER_KEY);
    if (!verifier) {
      setDropboxStatus('error');
      setDropboxError('Missing PKCE verifier. Please restart the Dropbox login.');
      searchParams.delete('code');
      searchParams.delete('state');
      setSearchParams(searchParams, { replace: true });
      return;
    }

    try {
      setDropboxStatus('authorizing');
      const body = new URLSearchParams({
        code: code || '',
        grant_type: 'authorization_code',
        client_id: DROPBOX_CLIENT_ID || '',
        code_verifier: verifier,
        redirect_uri: getRedirectUri(),
      });

      const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Token request failed: ${text}`);
      }

      const data = (await response.json()) as { access_token?: string };
      if (!data.access_token) {
        throw new Error('No access token returned from Dropbox.');
      }

      setStoredDropboxToken(data.access_token);
      setDropboxStatus('connected');
      setDropboxError(null);
      // Don't validate token immediately after login - it's fresh and valid
      // Load user info and years without validation
      void loadDropboxUserInfo(false); // Pass false to skip validation
      void loadDropboxYears();
      updateLastSyncTime();
      toast.success('Successfully connected to Dropbox!');
    } catch (e) {
      setDropboxStatus('error');
      const errorMsg = e instanceof Error ? e.message : 'Unexpected error exchanging Dropbox code.';
      setDropboxError(errorMsg);
      toast.error(errorMsg);
    } finally {
      try {
        sessionStorage.removeItem(DROPBOX_CODE_VERIFIER_KEY);
      } catch {
        // ignore
      }
      searchParams.delete('code');
      searchParams.delete('state');
      setSearchParams(searchParams, { replace: true });
    }
  };

  useEffect(() => {
    // Only handle callback if we have a code or error in URL and haven't processed it yet
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    if ((code || error) && !callbackProcessed) {
      void handleDropboxCallback();
    }
  }, [searchParams, callbackProcessed]);

  const handleDisconnectDropbox = () => {
    setModalState({
      isOpen: true,
      title: 'Disconnect Dropbox',
      message: 'Are you sure you want to disconnect your Dropbox account? Your data will no longer sync automatically.',
      confirmText: 'Disconnect',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: () => {
        setStoredDropboxToken(null);
        setDropboxStatus('disconnected');
        setDropboxError(null);
        setDropboxUser(null);
        setLastSyncTime(null);
        toast.info('Dropbox disconnected successfully');
        setModalState(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const uploadYearToDropbox = async (year: string) => {
    const token = getStoredDropboxToken();
    if (!token) {
      setDropboxStatus('disconnected');
      setDropboxError('You must connect Dropbox before syncing.');
      return;
    }

    setIsSyncing(true);
    setDropboxError(null);
    try {
      const data = getYearData(year);
      const contents = JSON.stringify(data, null, 2);
      const path = getDropboxYearPath(year);

      // Ensure folder exists
      try {
        await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: DROPBOX_FOLDER_PATH,
            autorename: false,
          }),
        });
      } catch {
        // Folder might already exist, ignore
      }

      const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path,
            mode: 'overwrite',
            mute: false,
            strict_conflict: false,
          }),
        },
        body: contents,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed: ${text}`);
      }

      await loadDropboxYears();
      toast.success(`${year}.json uploaded to Dropbox successfully`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unexpected error while uploading to Dropbox.';
      setDropboxError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  const uploadAllYearsToDropbox = async () => {
    const token = getStoredDropboxToken();
    if (!token) {
      setDropboxStatus('disconnected');
      setDropboxError('You must connect Dropbox before syncing.');
      return;
    }

    setIsSyncing(true);
    setDropboxError(null);
    try {
      const allYears = listYearKeys();
      const currentYear = getCurrentYear();
      const yearsToUpload = Array.from(new Set([...allYears, currentYear]));

      // Ensure folder exists
      try {
        const folderResponse = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: DROPBOX_FOLDER_PATH,
            autorename: false,
          }),
        });

        if (!folderResponse.ok && folderResponse.status !== 409) {
          // 409 means folder already exists, which is fine
          // Other errors might indicate token issues
          if (folderResponse.status === 401 || folderResponse.status === 400) {
            const isValid = await checkTokenValidity(token);
            if (!isValid) {
              setStoredDropboxToken(null);
              setDropboxStatus('disconnected');
              setDropboxError('Dropbox session expired. Please reconnect.');
              toast.error('Dropbox session expired. Please reconnect.');
              return;
            }
          }
        }
      } catch (error) {
        // Network error, continue anyway
        console.error('Error creating folder:', error);
      }

      // Upload each year file
      for (const year of yearsToUpload) {
        const data = getYearData(year);
        const contents = JSON.stringify(data, null, 2);
        const path = getDropboxYearPath(year);

        await fetch('https://content.dropboxapi.com/2/files/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              path,
              mode: 'overwrite',
              mute: false,
              strict_conflict: false,
            }),
          },
          body: contents,
        });
      }

      await loadDropboxYears();
      updateLastSyncTime();
      toast.success(`All years uploaded to Dropbox successfully`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unexpected error while uploading to Dropbox.';
      setDropboxError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadYearFromDropbox = async (year: string) => {
    const token = getStoredDropboxToken();
    if (!token) {
      setDropboxStatus('disconnected');
      setDropboxError('You must connect Dropbox before syncing.');
      return;
    }

    setIsSyncing(true);
    setDropboxError(null);
    try {
      const path = getDropboxYearPath(year);
      const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Dropbox-API-Arg': JSON.stringify({
            path,
          }),
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Download failed: ${text}`);
      }

      const text = await response.text();
      const parsed = JSON.parse(text) as YearStorageData;
      saveYearData(year, parsed);
      if (selectedYear === year) {
        loadYear(year);
      }
      loadYears();
      updateLastSyncTime();
      toast.success(`${year}.json downloaded from Dropbox successfully`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unexpected error while downloading from Dropbox.';
      setDropboxError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadAllYearsFromDropbox = async () => {
    const token = getStoredDropboxToken();
    if (!token) {
      setDropboxStatus('disconnected');
      setDropboxError('You must connect Dropbox before syncing.');
      return;
    }

    setIsSyncing(true);
    setDropboxError(null);
    try {
      // First load the list of available years
      const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: DROPBOX_FOLDER_PATH,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('No files found in Dropbox folder');
        }
        throw new Error(`Failed to list folder: ${response.statusText}`);
      }

      const data = (await response.json()) as { entries?: Array<{ name: string }> };
      const yearFiles =
        data.entries
          ?.filter(entry => entry.name.endsWith('.json'))
          .map(entry => entry.name.replace('.json', ''))
          .filter(year => /^\d{4}$/.test(year)) || [];

      // Download each year file
      for (const year of yearFiles) {
        await downloadYearFromDropbox(year);
      }
      await loadDropboxYears();
      loadYears();
      updateLastSyncTime();
      toast.success(`All years downloaded from Dropbox successfully`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unexpected error while downloading from Dropbox.';
      setDropboxError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteYearFromDropbox = async (year: string) => {
    const token = getStoredDropboxToken();
    if (!token) {
      setDropboxStatus('disconnected');
      setDropboxError('You must connect Dropbox before syncing.');
      return;
    }

    setModalState({
      isOpen: true,
      title: 'Delete Year File',
      message: `Delete ${year}.json from Dropbox? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        setIsSyncing(true);
        setDropboxError(null);
        try {
          const path = getDropboxYearPath(year);
          const response = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path,
            }),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Delete failed: ${text}`);
          }

          await loadDropboxYears();
          toast.success(`${year}.json deleted from Dropbox successfully`);
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : 'Unexpected error while deleting from Dropbox.';
          setDropboxError(errorMsg);
          toast.error(errorMsg);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  return (
    <div className="min-h-screen p-6 pb-24 md:pl-24 space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Data & Sync</h1>
          <p className="text-sm text-gray-400">
            Manage your local data and optionally sync it with your Dropbox account.
          </p>
        </div>

        <div className="flex gap-3 border-b border-[rgb(var(--border))] pb-2">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-6 py-3 text-sm font-semibold rounded-t-lg transition-all relative ${
              activeTab === 'local'
                ? 'text-blue-400 bg-[rgb(var(--card))] border-t border-x border-[rgb(var(--border))]'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="relative z-10">Local Storage</span>
            {activeTab === 'local' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('dropbox')}
            className={`px-6 py-3 text-sm font-semibold rounded-t-lg transition-all relative ${
              activeTab === 'dropbox'
                ? 'text-blue-400 bg-[rgb(var(--card))] border-t border-x border-[rgb(var(--border))]'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="relative z-10">Dropbox Sync</span>
            {activeTab === 'dropbox' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'local' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Local Data Manager</h2>
              <p className="text-sm text-gray-400">
                Inspect and edit all app data stored in your browser, organized by year.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] text-sm rounded-lg px-3 py-2 text-gray-200"
                value={selectedYear ?? ''}
                onChange={e => handleChangeYear(e.target.value)}
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                onClick={handleRefreshAll}
                className="px-3 py-2 text-sm rounded-lg border border-blue-500/60 text-blue-300 hover:bg-blue-500/10 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={handleClearYear}
                className="px-3 py-2 text-sm rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10 transition-colors"
              >
                Clear Year
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                viewMode === 'summary'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                  : 'border-[rgb(var(--border))] text-gray-300 hover:border-blue-500/60'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                viewMode === 'json'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-200'
                  : 'border-[rgb(var(--border))] text-gray-300 hover:border-blue-500/60'
              }`}
            >
              Raw JSON
            </button>
          </div>

          {viewMode === 'summary' && (
            <div className="space-y-4">
              {!hasData ? (
                <div className="rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-center text-gray-400">
                  No data stored yet for {selectedYear ?? getCurrentYear()}. Use the apps as normal
                  or switch to the JSON view to add data manually.
                </div>
              ) : (
                <div className="space-y-6">
                  {appGroups.map(group => (
                    <div
                      key={group.app}
                      className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 pb-3 border-b border-[rgb(var(--border))]">
                        {group.app}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.containers.map(container => {
                          const containerKey = `${group.app}-${container.key}`;
                          const isExpanded = expandedContainers.has(containerKey);
                          return (
                            <div
                              key={container.name}
                              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] overflow-hidden"
                            >
                              <div
                                onClick={() => toggleContainer(containerKey)}
                                className="p-3 cursor-pointer hover:bg-[rgb(var(--card))] transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h4 className="text-sm font-medium text-white break-all">
                                    {container.name}
                                  </h4>
                                  <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-[rgb(var(--border))] rounded-full px-2 py-0.5 flex-shrink-0">
                                    {container.type}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-blue-400">{container.count}</span>
                                    <span className="text-xs text-gray-400">{container.details}</span>
                                  </div>
                                  <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="border-t border-[rgb(var(--border))] p-3 bg-[rgb(var(--card))]">
                                  <div className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all max-h-96 overflow-auto">
                                    {formatValue(container.value)}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {viewMode === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Editing JSON for year{' '}
                  <span className="font-mono text-gray-200">{selectedYear}</span>
                </p>
                <button
                  onClick={handleSaveJson}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium transition-colors"
                >
                  {isSaving ? 'Saving…' : 'Save JSON'}
                </button>
              </div>

              <textarea
                value={editorValue}
                onChange={e => handleEditorChange(e.target.value)}
                spellCheck={false}
                className="w-full min-h-[260px] font-mono text-xs rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] focus:outline-none focus:border-blue-500/70 text-gray-200 p-3 resize-vertical"
              />

              {editorError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
                  {editorError}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'dropbox' && (
        <div className="space-y-6">
          {dropboxStatus !== 'connected' ? (
            <>
              <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 space-y-6">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/40">
                    <svg
                      className="w-8 h-8 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Connect to Dropbox</h2>
                  <p className="text-gray-300 max-w-md mx-auto">
                    Securely sync your productivity data to your Dropbox account. Your data stays
                    private and accessible across all your devices.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                    <div className="text-2xl mb-2">🔄</div>
                    <h3 className="font-semibold text-white mb-1">Auto-Sync</h3>
                    <p className="text-xs text-gray-400">
                      Your data automatically syncs every 30 seconds while you use the app
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                    <div className="text-2xl mb-2">☁️</div>
                    <h3 className="font-semibold text-white mb-1">Cloud Backup</h3>
                    <p className="text-xs text-gray-400">
                      Never lose your data. All your productivity data is safely backed up
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                    <div className="text-2xl mb-2">🆓</div>
                    <h3 className="font-semibold text-white mb-1">100% Free</h3>
                    <p className="text-xs text-gray-400">
                      No subscriptions, no hidden fees. Use your existing Dropbox account
                    </p>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => void startDropboxLogin()}
                    className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Connect Dropbox Account
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-semibold text-white">Connected</span>
                    </div>
                    {dropboxUser && (
                      <div className="text-xs text-gray-400">
                        <span className="text-gray-300">{dropboxUser.name}</span>
                        <span className="mx-2">•</span>
                        <span>{dropboxUser.email}</span>
                      </div>
                    )}
                    {lastSyncTime && (
                      <div className="text-xs text-gray-500">
                        Last synced:{' '}
                        <span className="text-gray-400">
                          {lastSyncTime.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleDisconnectDropbox}
                    className="px-4 py-2 text-sm rounded-lg border border-red-500/60 text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void uploadAllYearsToDropbox()}
                    disabled={isSyncing || dropboxStatus !== 'connected'}
                    className="px-4 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium transition-colors"
                  >
                    {isSyncing ? 'Uploading…' : 'Upload all years'}
                  </button>
                  <button
                    onClick={() => void downloadAllYearsFromDropbox()}
                    disabled={isSyncing || dropboxStatus !== 'connected'}
                    className="px-4 py-2 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-60 text-gray-200 font-medium transition-colors"
                  >
                    {isSyncing ? 'Downloading…' : 'Download all years'}
                  </button>
                  <button
                    onClick={() => void loadDropboxYears()}
                    disabled={isLoadingDropboxYears || dropboxStatus !== 'connected'}
                    className="px-4 py-2 text-xs rounded-lg border border-blue-500/60 text-blue-300 hover:bg-blue-500/10 disabled:opacity-60 transition-colors"
                  >
                    {isLoadingDropboxYears ? 'Loading…' : 'Refresh list'}
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-400">
                    Year files in Dropbox ({DROPBOX_FOLDER_PATH}):
                  </p>
                  {dropboxYears.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No year files found in Dropbox</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {dropboxYears.map(year => (
                        <div
                          key={year}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]"
                        >
                          <span className="text-xs font-mono text-gray-200">{year}.json</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => void uploadYearToDropbox(year)}
                              disabled={isSyncing}
                              className="px-2 py-1 text-[10px] rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white transition-colors"
                              title="Upload local data for this year"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => void downloadYearFromDropbox(year)}
                              disabled={isSyncing}
                              className="px-2 py-1 text-[10px] rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-60 text-gray-200 transition-colors"
                              title="Download and overwrite local data"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => void deleteYearFromDropbox(year)}
                              disabled={isSyncing}
                              className="px-2 py-1 text-[10px] rounded bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white transition-colors"
                              title="Delete from Dropbox"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {dropboxError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
                    {dropboxError}
                  </p>
                )}

                {!DROPBOX_CLIENT_ID && (
                  <p className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/40 rounded-lg px-3 py-2 mt-2">
                    Dropbox client ID is not configured. Set{' '}
                    <span className="font-mono">VITE_DROPBOX_CLIENT_ID</span> in your environment and
                    restart the dev server.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        onConfirm={modalState.onConfirm}
        onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}


