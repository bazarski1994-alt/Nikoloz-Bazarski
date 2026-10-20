import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidIpv4, ipToInt, intToIp, parseCidr, generateIpRange } from './networkUtils.ts';
import { identifyDeviceTraits, buildRtspUrls, generateM3uPlaylist } from './cameraFingerprint.ts';

test('IPv4 validation functions correctly', () => {
  assert.equal(isValidIpv4('192.168.1.1'), true);
  assert.equal(isValidIpv4('10.0.0.254'), true);
  assert.equal(isValidIpv4('256.0.0.1'), false);
  assert.equal(isValidIpv4('192.168.1'), false);
  assert.equal(isValidIpv4('abc.def.ghi.jkl'), false);
  assert.equal(isValidIpv4(''), false);
});

test('IP to Integer and back conversions are lossless', () => {
  const ip = '192.168.1.100';
  const num = ipToInt(ip);
  assert.equal(intToIp(num), ip);

  const loopback = '127.0.0.1';
  assert.equal(intToIp(ipToInt(loopback)), loopback);
});

test('parseCidr correctly calculates start, end, and host counts for /24', () => {
  const res = parseCidr('192.168.1.0/24');
  assert.equal(res.valid, true);
  assert.equal(res.networkIp, '192.168.1.0');
  assert.equal(res.startIp, '192.168.1.1');
  assert.equal(res.endIp, '192.168.1.254');
  assert.equal(res.totalHosts, 254);
});

test('parseCidr handles single IP notation', () => {
  const res = parseCidr('10.0.0.5');
  assert.equal(res.valid, true);
  assert.equal(res.startIp, '10.0.0.5');
  assert.equal(res.endIp, '10.0.0.5');
  assert.equal(res.totalHosts, 1);
});

test('generateIpRange creates bounded sequential IPs', () => {
  const ips = generateIpRange('192.168.1.0/30');
  assert.equal(ips.length, 2);
  assert.equal(ips[0], '192.168.1.1');
  assert.equal(ips[1], '192.168.1.2');
});

test('identifyDeviceTraits identifies Hikvision via port 8000', () => {
  const traits = identifyDeviceTraits({
    ports: [80, 554, 8000],
    httpTitle: 'Webs',
  });
  assert.equal(traits.vendor, 'Hikvision');
  assert.equal(traits.isCamera, true);
  assert.equal(traits.category, 'camera');
  assert.ok(traits.confidence >= 90);
});

test('identifyDeviceTraits identifies Dahua via port 37777', () => {
  const traits = identifyDeviceTraits({
    ports: [80, 554, 37777],
    httpTitle: 'WEB SERVICE',
  });
  assert.equal(traits.vendor, 'Dahua');
  assert.equal(traits.isCamera, true);
  assert.equal(traits.category, 'camera');
});

test('identifyDeviceTraits identifies Xiongmai via port 34567', () => {
  const traits = identifyDeviceTraits({
    ports: [80, 554, 34567],
    httpTitle: 'NETSurveillance WEB',
  });
  assert.equal(traits.vendor, 'Xiongmai');
  assert.equal(traits.isCamera, true);
  assert.equal(traits.category, 'camera');
});

test('identifyDeviceTraits identifies Windows Workstation via port 445 SMB and 3389 RDP', () => {
  const traits = identifyDeviceTraits({
    ports: [445, 3389, 139],
    httpServer: 'Microsoft-HTTPAPI/2.0',
  });
  assert.equal(traits.category, 'workstation');
  assert.equal(traits.isCamera, false);
});

test('identifyDeviceTraits identifies Network Printer via port 9100 RAW', () => {
  const traits = identifyDeviceTraits({
    ports: [9100, 80, 631],
    httpTitle: 'HP LaserJet Pro MFP',
  });
  assert.equal(traits.category, 'printer');
  assert.equal(traits.isCamera, false);
});

test('identifyDeviceTraits identifies Router via DNS 53 and Web', () => {
  const traits = identifyDeviceTraits({
    ports: [53, 80],
    httpTitle: 'Keenetic Web UI',
  });
  assert.equal(traits.category, 'router');
  assert.equal(traits.isCamera, false);
});

test('identifyDeviceTraits identifies Smart TV / Chromecast via port 8008', () => {
  const traits = identifyDeviceTraits({
    ports: [8008, 8009],
    httpTitle: 'Google Cast',
  });
  assert.equal(traits.category, 'tv-media');
  assert.equal(traits.isCamera, false);
});

test('buildRtspUrls generates standard stream paths and escapes credentials', () => {
  const urls = buildRtspUrls('192.168.1.50', 'Hikvision', 'admin', 'pass@123');
  assert.ok(urls.length > 0);
  assert.ok(urls[0].main.includes('/Streaming/Channels/101'));
  assert.ok(urls[0].main.includes('admin:pass%40123@192.168.1.50:554'));
});

test('generateM3uPlaylist outputs valid M3U file with RTSP streams for Android VLC', () => {
  const playlist = generateM3uPlaylist([
    {
      id: 'cam1',
      ip: '192.168.1.55',
      deviceType: 'ip-camera',
      category: 'camera',
      vendor: 'Hikvision',
      isCamera: true,
      confidence: 95,
      latencyMs: 12,
      lastSeen: new Date().toISOString(),
      openPorts: [{ port: 554, protocol: 'tcp', service: 'RTSP', isCameraRelated: true }],
      rtspUrls: [],
      androidPresets: [],
      securityIssues: [],
      riskLevel: 'safe',
    },
  ]);
  assert.ok(playlist.startsWith('#EXTM3U'));
  assert.ok(playlist.includes('192.168.1.55'));
  assert.ok(playlist.includes('rtsp://'));
});
