"""Tiện ích cho các lượt sửa "bản chính thức" (10/11/2026): thay chuỗi có kiểm số lần khớp, chỉ ghi tệp khi mọi phép thay đều khớp."""
import os, re, sys
R = '/home/claude/web'
class Files:
    def __init__(self):
        self.t = {}
        self.orig = {}
    def get(self, f):
        if f not in self.t:
            self.t[f] = self.orig[f] = open(os.path.join(R, f), encoding='utf8').read()
        return self.t[f]
    def rep(self, f, old, new, count=1):
        s = self.get(f)
        n = s.count(old)
        if count == 'all':
            assert n >= 1, ('KHONG THAY', f, old[:90])
        else:
            assert n == count, ('KHONG KHOP', f, old[:90], n)
        self.t[f] = s.replace(old, new)
        return n
    def sub(self, f, pat, new, count=None, flags=0):
        s = self.get(f)
        out, n = re.subn(pat, new, s, flags=flags)
        if count is not None:
            assert n == count, ('KHONG KHOP', f, pat[:90], n)
        else:
            assert n >= 1, ('KHONG THAY', f, pat[:90])
        self.t[f] = out
        return n
    def save(self):
        for f, s in self.t.items():
            if s != self.orig[f]:
                open(os.path.join(R, f), 'w', encoding='utf8').write(s)
                print('ghi', f, len(self.orig[f]), '->', len(s))
