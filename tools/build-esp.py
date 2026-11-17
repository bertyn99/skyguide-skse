#!/usr/bin/env python3
"""Build SkyGuide.esp (TES4 + QUST + PACK) without the Creation Kit.

Record-header format matches this install (SE 1.6.1170 era): every record
header is 24 bytes — type(4) + dataSize(4) + flags(4) + formID(4) + 8 extra
bytes (zeros; TES4 uses 00000000 2C000000). Subrecords are 6-byte headers.

All binary structures were extracted as ground truth from the local
Skyrim.esm:
  - QUST alias grammar:      dunCragslaneQST (0x000d5602)
  - QUST VMAD alias prop:    MS13BleakFallsBarrowArvelShouting (0x0003bc74)
  - VMAD fragments/alias-sec: WI-style quests (0x23eeb / 0x74a55)
  - PACK Travel w/ Ref-Alias: CR12PostQuestAelaPray (0x0010b110)

The quest auto-starts (Start Game Enabled) and announces itself to the JS
bridge via SkyGuide_AutoWalkReady (sender = quest) — no form-ID hardcoding
needed by the plugin, but 0x800/0x801 are assigned here anyway.
"""
import struct
import sys

def U16(v: int) -> bytes:
    return struct.pack("<H", v)


def wstring(s: bytes) -> bytes:
    return U16(len(s)) + s


def sub(stype: bytes, data: bytes) -> bytes:
    assert len(stype) == 4
    return stype + U16(len(data)) + data


def record(rtype: bytes, formid: int, flags: int, body: bytes) -> bytes:
    return (rtype + struct.pack("<I", len(body)) + struct.pack("<I", flags)
            + struct.pack("<I", formid) + b"\x00" * 8 + body)


# ---------------------------------------------------------------- VMAD
def vmad_script(name: bytes, status: int, props: list[tuple[bytes, int, bytes]]) -> bytes:
    """One script entry: wstring name + status u8 + count u16 + properties."""
    out = wstring(name) + bytes([status]) + U16(len(props))
    for pname, ptype, val in props:
        out += wstring(pname) + bytes([ptype]) + val
    return out


def vmad_object_alias(alias_id: int, quest_formid: int) -> bytes:
    """Object property value bound to a quest alias (9 bytes, objFormat 2)."""
    return struct.pack("<H", 1) + b"\x00" + struct.pack("<H", alias_id) + struct.pack("<I", quest_formid)


def build_vmad(quest_formid: int) -> bytes:
    # scripts section
    out = U16(5)                       # version
    out += U16(2)                      # objFormat
    out += U16(1)                      # scriptCount
    out += vmad_script(
        b"SkyGuideAutoWalk", 0,
        [(b"WalkTarget", 1, vmad_object_alias(1, quest_formid))],
    )
    # fragments section (zero fragments, empty fileName)
    out += U16(2)                      # unknown = 2
    out += bytes([0])                  # fragmentCount
    out += wstring(b"")                # fileName
    # alias-script section
    out += struct.pack("<i", 1)        # aliasCount
    out += struct.pack("<H", 0)        # aliasId = 0 (Traveler)
    out += struct.pack("<I", quest_formid)   # owning quest formID
    out += U16(5) + U16(2)             # constant bytes seen in all samples
    out += U16(1)                      # scriptCount for this alias
    out += vmad_script(b"SkyGuideAutoWalkAlias", 0, [])
    return out


# ---------------------------------------------------------------- QUST
def build_qust(quest_formid: int) -> bytes:
    b = sub(b"EDID", b"SkyGuideAutoWalkQuest\x00")
    b += sub(b"VMAD", build_vmad(quest_formid))
    # DNAM: flags 0x11 (start game enabled + run-on-load), priority 50, 8 zeros
    b += sub(b"DNAM", struct.pack("<HH", 0x0011, 50) + b"\x00" * 8)
    b += sub(b"NEXT", b"")             # modern-format delimiter
    b += sub(b"ANAM", struct.pack("<I", 2))   # next alias id
    # alias 0: Traveler = player (specific reference)
    b += sub(b"ALST", struct.pack("<I", 0))
    b += sub(b"ALID", b"Traveler\x00")
    b += sub(b"FNAM", struct.pack("<I", 0))          # no special fill flags
    b += sub(b"ALFR", struct.pack("<I", 0x14))       # PlayerRef
    b += sub(b"ALPC", struct.pack("<I", 0x801))      # SkyGuideTravelPackage
    b += sub(b"VTCK", struct.pack("<I", 0))
    b += sub(b"ALED", b"")
    # alias 1: WalkTarget — optional, no fill (script ForceRefTo's the target)
    b += sub(b"ALST", struct.pack("<I", 1))
    b += sub(b"ALID", b"WalkTarget\x00")
    b += sub(b"FNAM", struct.pack("<I", 0x1))        # optional
    b += sub(b"VTCK", struct.pack("<I", 0))
    b += sub(b"ALED", b"")
    return record(b"QUST", quest_formid, 0, b)


# ---------------------------------------------------------------- PACK
def build_pack(quest_formid: int) -> bytes:
    b = sub(b"EDID", b"SkyGuideTravelPackage\x00")
    # PKDT copied from CR12PostQuestAelaPray: type 0x12 (Travel)
    b += sub(b"PKDT", bytes.fromhex("000000001200022c00000000"))
    b += sub(b"PSDT", bytes.fromhex("ffff00ffff00000000000000"))  # anytime
    b += sub(b"QNAM", struct.pack("<I", quest_formid))
    # PKCU: (3, quest, 2) — mirrors AelaPray's shape
    b += sub(b"PKCU", struct.pack("<III", 3, quest_formid, 2))
    # data stack entry 0: destination = alias 1 (PTDA type 4 = Ref Alias)
    b += sub(b"ANAM", b"SingleRef\x00")
    b += sub(b"PTDA", struct.pack("<III", 4, 1, 0))
    # entry 1: stop radius = 100 units
    b += sub(b"ANAM", b"Float\x00")
    b += sub(b"CNAM", struct.pack("<f", 100.0))
    # entry 2: bool off
    b += sub(b"ANAM", b"Bool\x00")
    b += sub(b"CNAM", b"\x00")
    b += sub(b"UNAM", bytes([0]))
    b += sub(b"UNAM", bytes([1]))
    b += sub(b"UNAM", bytes([2]))
    b += sub(b"XNAM", bytes([3]))
    # empty Begin/End/Change procedure blocks (default Travel behavior)
    for tag in (b"POBA", b"POEA", b"POCA"):
        b += sub(tag, b"")
        b += sub(b"INAM", struct.pack("<I", 0))
        b += sub(b"PDTO", b"\x00" * 8)
    return record(b"PACK", quest_formid + 1, 0, b)


# ---------------------------------------------------------------- TES4
def build_tes4(num_records: int, next_object_id: int) -> bytes:
    body = sub(b"HEDR", struct.pack("<fiI", 1.7, num_records, next_object_id))
    body += sub(b"MAST", b"Skyrim.esm\x00")
    return record(b"TES4", 0, 0, body)


def build_esp() -> bytes:
    tes4 = build_tes4(2, 0x803)
    qust = build_qust(0x800)
    pack = build_pack(0x800)
    return tes4 + qust + pack


# ---------------------------------------------------------------- validate
def parse_back(blob: bytes) -> None:
    """Structural parse of what we just built — every offset must line up."""
    pos = 0
    records = []
    while pos < len(blob):
        assert blob[pos + 16:pos + 20] == b"\x00" * 4, "extra bytes must be zero"
        rtype = blob[pos:pos + 4]
        size = struct.unpack("<I", blob[pos + 4:pos + 8])[0]
        formid = struct.unpack("<I", blob[pos + 12:pos + 16])[0]
        body = blob[pos + 24:pos + 24 + size]
        assert len(body) == size
        p = 0
        subs = []
        while p < len(body):
            stype = body[p:p + 4]
            ssize = struct.unpack("<H", body[p + 4:p + 6])[0]
            subs.append((stype.decode("ascii", "replace"), ssize))
            p += 6 + ssize
        assert p == len(body), f"{rtype}: subrecords overrun body"
        records.append((rtype.decode(), formid, size, subs))
        pos += 24 + size
    assert pos == len(blob)
    for name, formid, size, subs in records:
        ss = " ".join(f"{t}({n})" for t, n in subs)
        print(f"{name} {formid:08x} size={size}: {ss}")
    # semantic checks
    qust = dict((t, n) for _, _, _, subs in records if _ == "QUST" for t, n in [])
    types = [r[0] for r in records]
    assert types == ["TES4", "QUST", "PACK"], types
    q = [r for r in records if r[0] == "QUST"][0]
    names = [t for t, _ in q[3]]
    assert names.count("ALST") == 2 and names.count("ALED") == 2
    print("parse-back OK")


def main() -> None:
    out = sys.argv[1] if len(sys.argv) > 1 else "SkyGuide.esp"
    blob = build_esp()
    with open(out, "wb") as f:
        f.write(blob)
    print(f"wrote {out} ({len(blob)} bytes)")
    parse_back(blob)


if __name__ == "__main__":
    main()
