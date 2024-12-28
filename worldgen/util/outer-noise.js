const {instance: {exports}, module} = await WebAssembly.instantiate(Uint8Array.from(atob('AGFzbQEAAAABOglgA39/fwF/YAJ/fwF/YAJ/fwBgBX9/f319AGAFf399fX8Bf2AEf39/fwF/YAF/AGAAAGAEf39/fwADEA8DAAIEAQIFBgcCBgYIAgAEBQFwAQQEBQMBAAEGOQh/AUGwwAALfwBBiP8BC38AQej4AAt/AEHowgALfwBB6MgAC38AQYj5AAt/AEH5/wELfwBBgIACCwdzCwZtZW1vcnkCAAlmaWxsTm9pc2UAAAdvZmZzZXRzAwEEc2VlZAMCBWNodW5rAwMGZXhwYW5kAAEIc3VyZmFjZXMDBAZjaHVuazIDBQlmaW5kQmlvbWUAAwpfX2RhdGFfZW5kAwYLX19oZWFwX2Jhc2UDBwkJAQBBAQsDBAkNCuBYD6g8CgJ/G30BfwF9AX8CfQV/En0PfwJ+I4CAgIAAQdAMayIFJICAgIAAAkACQCADQwAA4EBeDQAgAkGRydX5BWwhBkMAAIA/IQcMAQsgAkGRydX5BWwhBiAEQwAAgL+SIQhBACoC6P+BgAAhCUEAKgLU/4GAACEKQQAqAsD/gYAAIQtBACoCrP+BgAAhDEEAKgKY/4GAACENQQAqAuT/gYAAIQ5BACoC0P+BgAAhD0EAKgK8/4GAACEQQQAqAqj/gYAAIRFBACoClP+BgAAhEkEAKgLg/4GAACETQQAqAsz/gYAAIRRBACoCuP+BgAAhFUEAKgKk/4GAACEWQQAqApD/gYAAIRdBACoC3P+BgAAhGEEAKgLI/4GAACEZQQAqArT/gYAAIRpBACoCoP+BgAAhG0EAKgKM/4GAACEcQQAqAtj/gYAAIR1BACoCxP+BgAAhHkEAKgKw/4GAACEfQQAqApz/gYAAISBBACoCiP+BgAAhIUEAKALo+ICAACEiQwAAgD8hBwNAAkACQCADjUMAAIC/kiIjQwAAgE9dICNDAAAAAGAiAnFFDQAgI6khJAwBC0EAISQLIAcgAyAjkyIllCImQQJBfyAkQQAgAhsgI0P//39PXht0IgJBA3YgAnIgInMgBnNBreqs/wdsIiRBD3YgJHNBi82yo3hsIidBACACayIoIABxIiRBkcnV+QVsc0Gt6qz/B2wiKUEPdiApcyIpICggAXEiKEG5/dqZfmwiKnNBn4uY53tsIitBCHYgK3NBi82yo3hsskMAAAAwlJQiLEMAAIBBIAKzlSItIC0gLSAtIC0gACAka0EEdrOUIi6SIi+SIjCSIjGSIjIgMiAmICcgJCACakGRydX5BWxzQa3qrP8HbCIkQQ92ICRzIiQgKnNBn4uY53tsIidBCHYgJ3NBi82yo3hsskMAAAAwlJQgLJMiM0MAAEBAIDIgMpKTIjSUlJSSIjUgLSAtIC0gLSAtIAEgKGtBBHazlCIDkiI2kiI3kiI4kiItIC0gJiApICggAmpBuf3amX5sIgJzQZ+LmOd7bCIoQQh2IChzQYvNsqN4bLJDAAAAMJSUIjkgMiAyICYgJCACc0Gfi5jne2wiAkEIdiACc0GLzbKjeGyyQwAAADCUlCA5kyImIDSUlJSSIDWTIjJDAABAQCAtIC2SkyI0lJSUkiAJkiEJIDUgOCA4IDJDAABAQCA4IDiSkyI6lJSUkiAKkiEKIDUgNyA3IDJDAABAQCA3IDeSkyI7lJSUkiALkiELIDUgNiA2IDJDAABAQCA2IDaSkyI8lJSUkiAMkiEMIDUgAyADIDJDAABAQCADIAOSkyI9lJSUkiANkiENICwgMSAxIDNDAABAQCAxIDGSkyI1lJSUkiIyIC0gLSA5IDEgMSAmIDWUlJSSIDKTIjEgNJSUlJIgDpIhDiAyIDggOCAxIDqUlJSSIA+SIQ8gMiA3IDcgMSA7lJSUkiAQkiEQIDIgNiA2IDEgPJSUlJIgEZIhESAyIAMgAyAxID2UlJSSIBKSIRIgLCAwIDAgM0MAAEBAIDAgMJKTIjKUlJSSIjEgLSAtIDkgMCAwICYgMpSUlJIgMZMiMCA0lJSUkiATkiETIDEgOCA4IDAgOpSUlJIgFJIhFCAxIDcgNyAwIDuUlJSSIBWSIRUgMSA2IDYgMCA8lJSUkiAWkiEWIDEgAyADIDAgPZSUlJIgF5IhFyAsIC8gLyAzQwAAQEAgLyAvkpMiMZSUlJIiMCAtIC0gOSAvIC8gJiAxlJSUkiAwkyIvIDSUlJSSIBiSIRggMCA4IDggLyA6lJSUkiAZkiEZIDAgNyA3IC8gO5SUlJIgGpIhGiAwIDYgNiAvIDyUlJSSIBuSIRsgMCADIAMgLyA9lJSUkiAckiEcICwgLiAuIDNDAABAQCAuIC6SkyIwlJSUkiIvIC0gLSA5IC4gLiAmIDCUlJSSIC+TIi4gNJSUlJIgHZIhHSAvIDggOCAuIDqUlJSSIB6SIR4gLyA3IDcgLiA7lJSUkiAfkiEfIC8gNiA2IC4gPJSUlJIgIJIhICAvIAMgAyAuID2UlJSSICGSISEgByAIICWUQwAAgD+SlCEHICMhAyAjQwAA4EBeDQALQQAgHTgC2P+BgABBACAeOALE/4GAAEEAIB84ArD/gYAAQQAgIDgCnP+BgABBACAhOAKI/4GAAEEAIBg4Atz/gYAAQQAgGTgCyP+BgABBACAaOAK0/4GAAEEAIBs4AqD/gYAAQQAgHDgCjP+BgABBACATOALg/4GAAEEAIBQ4Asz/gYAAQQAgFTgCuP+BgABBACAWOAKk/4GAAEEAIBc4ApD/gYAAQQAgDjgC5P+BgABBACAPOALQ/4GAAEEAIBA4Arz/gYAAQQAgETgCqP+BgABBACASOAKU/4GAAEEAIAk4Auj/gYAAQQAgCjgC1P+BgABBACALOALA/4GAAEEAIAw4Aqz/gYAAQQAgDTgCmP+BgAAgIyEDC0MAAMBAITZDAAAAACE3AkACQCADQwAAwEBeDQBDAAAAACEvQwAAAAAhPEMAAAAAIT0gAyE2DAELIANDAADAwJIiOCAHlCIDQQAoAuz4gIAAIAZzQa3qrP8HbCICQQ92IAJzQYvNsqN4bCIkIABBgH9xQZHJ1fkFbCIoQYCRydV5anNBreqs/wdsIgJBD3YgAnMiJyABQYB/cUG5/dqZfmwiAkGAuf3aeWoiKXNBn4uY53tsIipBCHYgKnNBi82yo3hsskMAAAAwlJQhNyADICQgKHNBreqs/wdsIiRBD3YgJHMiJCApc0Gfi5jne2wiKEEIdiAoc0GLzbKjeGyyQwAAADCUlCEvIAMgJyACc0Gfi5jne2wiKEEIdiAoc0GLzbKjeGyyQwAAADCUlCE8IAMgJCACc0Gfi5jne2wiAkEIdiACc0GLzbKjeGyyQwAAADCUlCE9IAcgBEMAAIC/kiA4lEMAAIA/kpQhBwtBACgC8PiAgAAhAgJAAkACQAJAAkAgNkMAAKBAXkUNACA2QwAAoMCSIjYgB5QiAyACIAZzIj5BACgC6PiAgABzQa3qrP8HbCICQQ92IAJzQYvNsqN4bCIoIABBkcnV+QVsIidBwMjk6nxqIj9zQa3qrP8HbCICQQ92IAJzIikgAUG5/dqZfmwiAkHA3L7tfGoiJHNBn4uY53tsIipBCHYgKnNBi82yo3hsskMAAAAwlJQhLiADICggJ3NBreqs/wdsIihBD3YgKHMiKCAkc0Gfi5jne2wiKkEIdiAqc0GLzbKjeGyyQwAAADCUlCEwIAMgKSACc0Gfi5jne2wiKUEIdiApc0GLzbKjeGyyQwAAADCUlCEJIAMgKCACc0Gfi5jne2wiKEEIdiAoc0GLzbKjeGyyQwAAADCUlCEKQwAAgD8hLSAHIARDAACAv5IiOCA2lEMAAIA/kpQhB0EAKALs+ICAACFADAELQQAoAuz4gIAAIUAgBUEgakEANgIAIAVBGGpCADcDACAFQRBqQgA3AwAgBUEIakIANwMAIAVCADcDACACIAZzIT4gNkMAAIBAXkUNASA2QwAAgMCSIS0gBEMAAIC/kiE4IABBkcnV+QVsIidBwMjk6nxqIT8gAUG5/dqZfmwiAkHA3L7tfGohJEMAAAAAIQpDAAAAACEJQwAAAAAhMEMAAAAAIS4LIAUgLSAHlCIDICcgPiBAc0Gt6qz/B2wiKEEPdiAoc0GLzbKjeGwiKnNBreqs/wdsIilBD3YiKyAkcyApc0Gfi5jne2wiKEEIdiAoc0GLzbKjeGyyQwAAADCUlDgCGCAFIAMgKyACQaCu37YGaiIocyApc0Gfi5jne2wiIkEIdiAic0GLzbKjeGyyQwAAADCUlDgCDCAFIAMgKyACcyApc0Gfi5jne2wiKUEIdiApc0GLzbKjeGyyQwAAADCUlDgCACAFIAMgJ0GgpLK1fmoiQSAqc0Gt6qz/B2wiKUEPdiIrICRzIClzQZ+LmOd7bCIiQQh2ICJzQYvNsqN4bLJDAAAAMJSUOAIcIAUgAyArIChzIClzQZ+LmOd7bCIiQQh2ICJzQYvNsqN4bLJDAAAAMJSUOAIQIAUgAyArIAJzIClzQZ+LmOd7bCIpQQh2IClzQYvNsqN4bLJDAAAAMJSUOAIEIAUgAyA/ICpzQa3qrP8HbCIpQQ92IiogJHMgKXNBn4uY53tsIitBCHYgK3NBi82yo3hsskMAAAAwlJQ4AiAgBSADICogKHMgKXNBn4uY53tsIitBCHYgK3NBi82yo3hsskMAAAAwlJQ4AhQgBSADICogAnMgKXNBn4uY53tsIilBCHYgKXNBi82yo3hsskMAAAAwlJQ4AghDAACAPyE2IAcgOCAtlEMAAIA/kpQhB0EAKAL0+ICAACFCQQAoAuj4gIAAIUMMAQtBACgC6PiAgAAhQ0EAKAL0+ICAACFCIAVBJGpBAEHkABCOgICAABpDAAAAACEuAkAgNkMAAEBAXg0AQwAAAAAhMEMAAAAAIQlDAAAAACEKDAILIDZDAABAwJIhNiAEQwAAgL+SITggAEGRydX5BWwiJ0HAyOTqfGohPyAnQaCksrV+aiFBIAFBuf3amX5sIgJBwNy+7XxqISQgAkGgrt+2BmohKEMAAAAAIS5DAAAAACEwQwAAAAAhCUMAAAAAIQoLIAUgNiAHlCIDICcgQiAGcyBDc0Gt6qz/B2wiKUEPdiApc0GLzbKjeGwiKnNBreqs/wdsIilBD3YiKyAkcyApc0Gfi5jne2wiIkEIdiAic0GLzbKjeGyyQwAAADCUlDgCdCAFIAMgKyACQbCFj9J5aiIicyApc0Gfi5jne2wiREEIdiBEc0GLzbKjeGyyQwAAADCUlDgCYCAFIAMgKyAocyApc0Gfi5jne2wiREEIdiBEc0GLzbKjeGyyQwAAADCUlDgCTCAFIAMgKyACQZDXr5sDaiJEcyApc0Gfi5jne2wiRUEIdiBFc0GLzbKjeGyyQwAAADCUlDgCOCAFIAMgKyACcyApc0Gfi5jne2wiKUEIdiApc0GLzbKjeGyyQwAAADCUlDgCJCAFIAMgJ0GQktmaf2ogKnNBreqs/wdsIilBD3YiKyAkcyApc0Gfi5jne2wiRUEIdiBFc0GLzbKjeGyyQwAAADCUlDgCeCAFIAMgKyAicyApc0Gfi5jne2wiRUEIdiBFc0GLzbKjeGyyQwAAADCUlDgCZCAFIAMgKyAocyApc0Gfi5jne2wiRUEIdiBFc0GLzbKjeGyyQwAAADCUlDgCUCAFIAMgKyBEcyApc0Gfi5jne2wiRUEIdiBFc0GLzbKjeGyyQwAAADCUlDgCPCAFIAMgKyACcyApc0Gfi5jne2wiKUEIdiApc0GLzbKjeGyyQwAAADCUlDgCKCAFIAMgQSAqc0Gt6qz/B2wiKUEPdiIrICRzIClzQZ+LmOd7bCJBQQh2IEFzQYvNsqN4bLJDAAAAMJSUOAJ8IAUgAyArICJzIClzQZ+LmOd7bCJBQQh2IEFzQYvNsqN4bLJDAAAAMJSUOAJoIAUgAyArIChzIClzQZ+LmOd7bCJBQQh2IEFzQYvNsqN4bLJDAAAAMJSUOAJUIAUgAyArIERzIClzQZ+LmOd7bCJBQQh2IEFzQYvNsqN4bLJDAAAAMJSUOAJAIAUgAyArIAJzIClzQZ+LmOd7bCIpQQh2IClzQYvNsqN4bLJDAAAAMJSUOAIsIAUgAyAnQbC2i9B9aiAqc0Gt6qz/B2wiJ0EPdiIpICRzICdzQZ+LmOd7bCIrQQh2ICtzQYvNsqN4bLJDAAAAMJSUOAKAASAFIAMgKSAicyAnc0Gfi5jne2wiK0EIdiArc0GLzbKjeGyyQwAAADCUlDgCbCAFIAMgKSAocyAnc0Gfi5jne2wiK0EIdiArc0GLzbKjeGyyQwAAADCUlDgCWCAFIAMgKSBEcyAnc0Gfi5jne2wiK0EIdiArc0GLzbKjeGyyQwAAADCUlDgCRCAFIAMgKSACcyAnc0Gfi5jne2wiJ0EIdiAnc0GLzbKjeGyyQwAAADCUlDgCMCAFIAMgPyAqc0Gt6qz/B2wiJ0EPdiIpICRzICdzQZ+LmOd7bCIkQQh2ICRzQYvNsqN4bLJDAAAAMJSUOAKEASAFIAMgKSAicyAnc0Gfi5jne2wiJEEIdiAkc0GLzbKjeGyyQwAAADCUlDgCcCAFIAMgKSAocyAnc0Gfi5jne2wiJEEIdiAkc0GLzbKjeGyyQwAAADCUlDgCXCAFIAMgKSBEcyAnc0Gfi5jne2wiJEEIdiAkc0GLzbKjeGyyQwAAADCUlDgCSCAFIAMgKSACcyAnc0Gfi5jne2wiAkEIdiACc0GLzbKjeGyyQwAAADCUlDgCNCAHIDggNpRDAACAP5KUIQdDAABAQCE2CyABQQZ2IUYgAEEGdiFHIAVBiAFqQQBBxAIQjoCAgAAaAkAgNkMAAABAXkUNACBAIAZzIEJzQa3qrP8HbCICQQ92IAJzQYvNsqN4bCEGIARDAACAv5IgNkMAAADAkiIDlCE2IABBkcnV+QVsIScgAUG5/dqZfmwiK0HA3L7tfGohIiArQfjw5p97aiFEICtBsIWP0nlqIT8gK0HombeEeGohQCArQaCu37YGaiFBICtB2MKH6QRqIUUgK0GQ16+bA2ohSCArQcjr180BaiFJIAMgB5QhA0FcISkDQCAFQYgBaiApaiIkQcQCaiADICcgBnNBreqs/wdsIgJBD3YiKCAicyACc0Gfi5jne2wiKkEIdiAqc0GLzbKjeGyyQwAAADCUlDgCACAkQaACaiADICggRHMgAnNBn4uY53tsIipBCHYgKnNBi82yo3hsskMAAAAwlJQ4AgAgJEH8AWogAyAoID9zIAJzQZ+LmOd7bCIqQQh2ICpzQYvNsqN4bLJDAAAAMJSUOAIAICRB2AFqIAMgKCBAcyACc0Gfi5jne2wiKkEIdiAqc0GLzbKjeGyyQwAAADCUlDgCACAkQbQBaiADICggQXMgAnNBn4uY53tsIipBCHYgKnNBi82yo3hsskMAAAAwlJQ4AgAgJEGQAWogAyAoIEVzIAJzQZ+LmOd7bCIqQQh2ICpzQYvNsqN4bLJDAAAAMJSUOAIAICRB7ABqIAMgKCBIcyACc0Gfi5jne2wiKkEIdiAqc0GLzbKjeGyyQwAAADCUlDgCACAkQcgAaiADICggSXMgAnNBn4uY53tsIipBCHYgKnNBi82yo3hsskMAAAAwlJQ4AgAgJEEkaiADICggK3MgAnNBn4uY53tsIgJBCHYgAnNBi82yo3hsskMAAAAwlJQ4AgAgJ0GIyaxNaiEnIClBBGoiKQ0ACyAHIDZDAACAP5KUIQdDAAAAQCE2CyBGQQFxIUogR0EBcSFLIAVBzANqQQBBhAkQjoCAgAAaAkAgNkMAAIA/XkUNACA+IENzIEJzQa3qrP8HbCICQQ92IAJzQYvNsqN4bCEqIABBkcnV+QVsIScgAUG5/dqZfmwiAEHA3L7tfGohKyAAQdzm0oYEaiEGIABB+PDmn3tqISIgAEGU+/q4AmohRCAAQbCFj9J5aiE/IABBzI+j6wBqIUAgAEHombeEeGohQSAAQYSky51/aiFFIABBoK7ftgZqIUggAEG8uPPPfWohSSAAQdjCh+kEaiFCIABB9MybgnxqIUMgAEGQ16+bA2ohPiAAQazhw7R6aiFGIABByOvXzQFqIUcgAEHk9evmeGohTCAHIDZDAACAv5KUIQNBvH8hKQNAIAVBzANqIClqIiRBhAlqIAMgJyAqc0Gt6qz/B2wiAkEPdiIoICtzIAJzQZ+LmOd7bCIBQQh2IAFzQYvNsqN4bLJDAAAAMJSUOAIAICRBwAhqIAMgKCAGcyACc0Gfi5jne2wiAUEIdiABc0GLzbKjeGyyQwAAADCUlDgCACAkQfwHaiADICggInMgAnNBn4uY53tsIgFBCHYgAXNBi82yo3hsskMAAAAwlJQ4AgAgJEG4B2ogAyAoIERzIAJzQZ+LmOd7bCIBQQh2IAFzQYvNsqN4bLJDAAAAMJSUOAIAICRB9AZqIAMgKCA/cyACc0Gfi5jne2wiAUEIdiABc0GLzbKjeGyyQwAAADCUlDgCACAkQbAGaiADICggQHMgAnNBn4uY53tsIgFBCHYgAXNBi82yo3hsskMAAAAwlJQ4AgAgJEHsBWogAyAoIEFzIAJzQZ+LmOd7bCIBQQh2IAFzQYvNsqN4bLJDAAAAMJSUOAIAICRBqAVqIAMgKCBFcyACc0Gfi5jne2wiAUEIdiABc0GLzbKjeGyyQwAAADCUlDgCACAkQeQEaiADICggSHMgAnNBn4uY53tsIgFBCHYgAXNBi82yo3hsskMAAAAwlJQ4AgAgJEGgBGogAyAoIElzIAJzQZ+LmOd7bCIBQQh2IAFzQYvNsqN4bLJDAAAAMJSUOAIAICRB3ANqIAMgKCBCcyACc0Gfi5jne2wiAUEIdiABc0GLzbKjeGyyQwAAADCUlDgCACAkQZgDaiADICggQ3MgAnNBn4uY53tsIgFBCHYgAXNBi82yo3hsskMAAAAwlJQ4AgAgJEHUAmogAyAoID5zIAJzQZ+LmOd7bCIBQQh2IAFzQYvNsqN4bLJDAAAAMJSUOAIAICRBkAJqIAMgKCBGcyACc0Gfi5jne2wiAUEIdiABc0GLzbKjeGyyQwAAADCUlDgCACAkQcwBaiADICggR3MgAnNBn4uY53tsIgFBCHYgAXNBi82yo3hsskMAAAAwlJQ4AgAgJEGIAWogAyAoIExzIAJzQZ+LmOd7bCIBQQh2IAFzQYvNsqN4bLJDAAAAMJSUOAIAICRBxABqIAMgKCAAcyACc0Gfi5jne2wiAkEIdiACc0GLzbKjeGyyQwAAADCUlDgCACAnQcSk1uYHaiEnIClBBGoiKQ0ACwsgSrMhByBLsyE6IC4gCZMhCyAwIAqTIQwgNyA8kyENIC8gPZMhDkMAAAA8ITtBACEqA0AgPCA7IAeSQwAAAD+UIgMgAyANQwAAQEAgAyADkpMiNpSUlJIgPSADIAMgDiA2lJSUkiI5kyEzIAkgOyA7IAtDAABAQCA7IDuSkyIDlJSUkiAKIDsgOyAMIAOUlJSSIiaTITQgKkECdkERbCEnICpBA3ZBCWwhKSAqQQR2QQVsIQEgKkEFdkEDbCEAQwAAQEAgKkEDcbNDAACAPpQiOCA4kpMhMEMAAEBAICpBB3GzQwAAAD6UIi0gLZKTITFDAABAQCAqQQ9xs0MAAIA9lCI2IDaSkyEjQwAAQEAgKkEfcbNDAAAAPZQiLiAukpMhLEEAIQJCACFNQwAAADwhA0IAIU4DQEIBIE2GQgAgAkEEdiABakECdCIkQYj/gYAAaioCACI3IDYgJEGc/4GAAGoqAgAgN5OUkiIvIAJBD3GzQwAAgD2UIjcgJEGM/4GAAGoqAgAiMiA2ICRBoP+BgABqKgIAIDKTlJIgL5OUkiAmIAMgAyA0QwAAQEAgAyADkpOUlJSSIDkgAyA6kkMAAAA/lCIvIC8gM0MAAEBAIC8gL5KTlJSUkpIgBSACQQV2IABqQQJ0aiIoKgIAIi8gLiAuICwgKEEMaioCACAvk5SUlJIiMiACQR9xs0MAAAA9lCIvIC9DAABAQCAvIC+SkyAoQQRqKgIAIjUgLiAuICwgKEEQaioCACA1k5SUlJIgMpOUlJSSkiAFQSRqICRqIiQqAgAiLyA2IDYgIyAkQRRqKgIAIC+TlJSUkiIvIDcgN0MAAEBAIDcgN5KTICRBBGoqAgAiMiA2IDYgIyAkQRhqKgIAIDKTlJSUkiAvk5SUlJKSkiAFQYgBaiACQQN2IClqQQJ0aiIkKgIAIjcgLSAtIDEgJEEkaioCACA3k5SUlJIiLyACQQdxs0MAAAA+lCI3IDdDAABAQCA3IDeSkyAkQQRqKgIAIjIgLSAtIDEgJEEoaioCACAyk5SUlJIgL5OUlJSSkiAFQcwDaiACQQJ2ICdqQQJ0aiIkKgIAIjcgOCA4IDAgJEHEAGoqAgAgN5OUlJSSIi8gAkEDcbNDAACAPpQiNyA3QwAAQEAgNyA3kpMgJEEEaioCACIyIDggOCAwICRByABqKgIAIDKTlJSUkiAvk5SUlJKSQwAAAABeGyBOhCFOIAJBAWohAiADQwAAgDySIQMgTUIBfCJNQsAAUg0ACyAqQQN0QejCgIAAaiBONwMAIDtDAACAPJIhOyAqQQFqIipBwABHDQALIAVB0AxqJICAgIAAC8UMBgZ/An4EfwF+B38BfkEAIQNBACgC9PiAgAAhBEEAKALw+ICAACEFQQAoAuz4gIAAIQYCQAJAAkACQAJAAkACQAJAAkACQEEALwHoyICAACIHQQFGDQBB0AAhCEJ/IQkDQAJAIAlCf4UgCEF/aiIIQQN0QejCgIAAaikDACIJgyIKUA0AIANBgBggA0GAGEsbIQsgA0EBdEHoyICAAGohDCAIQQZ0Ig1BgP4DcUEIdiEOA0AgCyADRg0FIAwgDSAKeiIPp3JBCHQgDnI7AQAgDEECaiEMIANBAWohAyAKQn4gD4mDIgpQRQ0ACwsgCEHAAEsNAAwCCwtBACEDQdAAIQ5CfyEJA0ACQCAJQn+FIA5Bf2oiDkEDdEHowoCAAGopAwAiCYMiClANACADQYAYIANBgBhLGyELIA5BBnQhDSADQQF0QejIgIAAaiEMA0AgCyADRg0FIAwgDSAKeiIPp3I7AQAgDEECaiEMIANBAWohAyAKQn4gD4mDIgpCAFINAAsLIA5BwABLDQALCyAEIAJBkcnV+QVscyAFcyAGc0Gt6qz/B2wiDEEPdiAMc0GLzbKjeGwhECAAQZHJ1fkFbCERQcABIRJBwAAhEyAHQQFHIRQCQANAIBNBCHQiDEGI+YCAAGohFSAMQYj9gIAAaiEWIAkhFwNAIBJBAnQiDEGA/4CAAGooAgAhCyAMQYD5gIAAaigCACENIBNBf2oiE0EDdEHowoCAAGopAwAhCQJAAkAgDEH8/oCAAGooAgAiAiASQX1qIhJBAnRBiPmAgABqKAIAIgByQf8BcQ0AQgAhDyAVIQwDQCAMQYwEaiANIAsgCSAPiCIKQgiDUBs2AgAgDEGIBGogDSALIApCBINQGzYCACAMQYQEaiANIAsgCkICg1AbNgIAIAxBgARqIA0gCyAKQgGDUBs2AgAgDEEQaiEMIA9CBHwiD0LAAFINAAwCCwsgEyABakG5/dqZfmwhBCAMQYT/gIAAaigCACEFIAxBhPmAgABqKAIAIQZCACEKIBEhDCAWIQ4DQCAOIAYgDSAEIAwgEHNBreqs/wdsIghBD3ZzIAhzQZ+LmOd7bCIIQQh2IAhzQYt/bEH/AXEiCCAAQf8BcUkbIAUgCyAIIAJB/wFxSRsgCSAKiEIBg1AbNgIAIAxBkcnV+QVqIQwgDkEEaiEOIApCAXwiCkLAAFINAAsLIAkgF0J/hYMhCgJAAkACQAJAAkAgFA0AAkAgClBFDQAgEw0EDA0LIANBgBggA0GAGEsbIQsgE0EGdCENIANBAXRB6MiAgABqIQwDQCALIANGDQggDCANIAp6Ig+ncjsBACAMQQJqIQwgA0EBaiEDIApCfiAPiYMiClBFDQAMAgsLIApQDQEgA0GAGCADQYAYSxshCyADQQF0QejIgIAAaiEMIBNBBnQiDUGA/gNxQQh2IQ4DQCALIANGDQQgDCANIAp6Ig+nckEIdCAOcjsBACAMQQJqIQwgA0EBaiEDIApCfiAPiYMiClBFDQALCyATRQ0IDAQLIBNFDQgLIBVBgH5qIRUgFkGAfmohFiAJIRcMAQsLCyALQczAgIAAEIKAgIAAAAsgC0G8wICAABCCgICAAAALIAtBzMCAgAAQgoCAgAAACyALQbzAgIAAEIKAgIAAAAsgB0EBRg0BC0HgACENA0ACQCAJQn+FIA1Bf2oiCEEDdEHowoCAAGopAwAiCYMiClANACADQYAYIANBgBhLGyELIANBAXRB6MiAgABqIQwgDUEGdEHAzwNqIg1BgP4DcUEIdiEOA0AgCyADRg0GIAwgDSAKeiIPp3JBCHQgDnI7AQAgDEECaiEMIANBAWohAyAKQn4gD4mDIgpQRQ0ACwsgCCENIAhB0ABLDQAMAgsLQeAAIQ0DQAJAIAlCf4UgDUF/aiIOQQN0QejCgIAAaikDACIJgyIKUA0AIANBgBggA0GAGEsbIQsgA0EBdEHoyICAAGohDCANQQZ0QcDPA2ohDQNAIAsgA0YNBCAMIA0gCnoiD6dyOwEAIAxBAmohDCADQQFqIQMgCkJ+IA+JgyIKQgBSDQALCyAOIQ0gDkHQAEsNAAsLIAMPCyALQbzAgIAAEIKAgIAAAAsgC0HMwICAABCCgICAAAALegIBfwF+I4CAgIAAQTBrIgIkgICAgAAgAkGAGDYCBCACIAA2AgAgAkECNgIMIAJBkMGAgAA2AgggAkICNwIUIAJBgYCAgACtQiCGIgMgAq2ENwMoIAIgAyACQQRqrYQ3AyAgAiACQSBqNgIQIAJBCGogARCFgICAAAAL4AEEBn8BfQN/AX0gAEEMaiEFAkADQCAAIAEiBkEYbGoiBygCECIIRQ0BIAcoAhQiCSAIaiEKQwAAgH8hCyAGIQEDQCAJIAogCSAKSxshDCAFIAlBGGxqIQgDQCAIIQcCQCAMIAkiDUcNACABIAZHDQMMBAsgDUEBaiEJAkAgBygCACIOQf////8HRg0AIAdBGGohCCAOIARHDQELCyAHQXRqIgcqAgggByoCACACkyIPIA+UIAcqAgQgA5MiDyAPlJKUIg8gCyAPIAtfIgcbIQsgDSABIAcbIQEMAAsLCyAGC6AHAQx/I4CAgIAAQRBrIgIkgICAgABBCiEDAkACQCAAKAIAIgBBkM4ATw0AIAAhBAwBC0EKIQMDQCACQQZqIANqIgVBfGogAEGQzgBuIgRB8LEDbCAAaiIGQf//A3FB5ABuIgdBAXRBoMGAgABqLwAAOwAAIAVBfmogB0Gcf2wgBmpB//8DcUEBdEGgwYCAAGovAAA7AAAgA0F8aiEDIABB/8HXL0shBSAEIQAgBQ0ACwsCQAJAIARB4wBLDQAgBCEFDAELIAJBBmogA0F+aiIDaiAEQf//A3FB5ABuIgVBnH9sIARqQf//A3FBAXRBoMGAgABqLwAAOwAACwJAAkAgBUEKSQ0AIAJBBmogA0F+aiIAaiAFQQF0QaDBgIAAai8AADsAAAwBCyACQQZqIANBf2oiAGogBUEwcjoAAAtBCiAAayEHQQEhA0ErQYCAxAAgASgCHCIEQQFxIgUbIQggBEEEcUECdiEJIAJBBmogAGohCgJAAkAgASgCAA0AIAEoAhQiACABKAIYIgQgCCAJEIaAgIAADQEgACAKIAcgBCgCDBGAgICAAICAgIAAIQMMAQsCQCABKAIEIgsgBSAHaiIGSw0AIAEoAhQiACABKAIYIgQgCCAJEIaAgIAADQEgACAKIAcgBCgCDBGAgICAAICAgIAAIQMMAQsCQCAEQQhxRQ0AIAEoAhAhDCABQTA2AhAgAS0AICENQQEhAyABQQE6ACAgASgCFCIEIAEoAhgiBiAIIAkQhoCAgAANASAAIAtqIAVrQXdqIQACQANAIABBf2oiAEUNASAEQTAgBigCEBGBgICAAICAgIAARQ0ADAMLCyAEIAogByAGKAIMEYCAgIAAgICAgAANASABIA06ACAgASAMNgIQQQAhAwwBCyALIAZrIQsCQAJAAkAgAS0AICIADgQCAAEAAgsgCyEAQQAhCwwBCyALQQF2IQAgC0EBakEBdiELCyAAQQFqIQAgASgCECEGIAEoAhghBCABKAIUIQUCQANAIABBf2oiAEUNASAFIAYgBCgCEBGBgICAAICAgIAARQ0AC0EBIQMMAQtBASEDIAUgBCAIIAkQhoCAgAANACAFIAogByAEKAIMEYCAgIAAgICAgAANAEEAIQADQAJAIAsgAEcNACALIAtJIQMMAgsgAEEBaiEAIAUgBiAEKAIQEYGAgIAAgICAgABFDQALIABBf2ogC0khAwsgAkEQaiSAgICAACADCzYBAX8jgICAgABBEGsiAiSAgICAACACQQE7AQwgAiABNgIIIAIgADYCBCACQQRqEIeAgIAAAAtJAAJAIAJBgIDEAEYNACAAIAIgASgCEBGBgICAAICAgIAARQ0AQQEPCwJAIAMNAEEADwsgACADQQAgASgCDBGAgICAAICAgIAACzgCAX8BfiOAgICAAEEQayIBJICAgIAAIAApAgAhAiABIAA2AgwgASACNwIEIAFBBGoQioCAgAAACwMAAAsJACAAQQA2AgALCwAgABCLgICAAAALugEBA38jgICAgABBEGsiASSAgICAACAAKAIAIgIoAgwhAwJAAkACQAJAIAIoAgQOAgABAgsgAw0BQQEhAkEAIQMMAgsgAw0AIAIoAgAiAigCBCEDIAIoAgAhAgwBCyABQYCAgIB4NgIAIAEgADYCDCABQYKAgIAAIAAoAggiAC0ACCAALQAJEIyAgIAAAAsgASADNgIEIAEgAjYCACABQYOAgIAAIAAoAggiAC0ACCAALQAJEIyAgIAAAAuZAQECfyOAgICAAEEQayIEJICAgIAAQQBBACgC8P+BgAAiBUEBajYC8P+BgAACQCAFQQBIDQACQAJAQQAtAPj/gYAADQBBAEEAKAL0/4GAAEEBajYC9P+BgABBACgC7P+BgABBf0oNAQwCCyAEQQhqIAAgARGCgICAAICAgIAAAAtBAEEAOgD4/4GAACACRQ0AEIiAgIAAAAsACwwAIAAgASkCADcDAAu1AQEDfwJAAkAgAkEQTw0AIAAhAwwBCyAAQQAgAGtBA3EiBGohBQJAIARFDQAgACEDA0AgAyABOgAAIANBAWoiAyAFSQ0ACwsgBSACIARrIgRBfHEiAmohAwJAIAJBAUgNACABQf8BcUGBgoQIbCECA0AgBSACNgIAIAVBBGoiBSADSQ0ACwsgBEEDcSECCwJAIAJFDQAgAyACaiEFA0AgAyABOgAAIANBAWoiAyAFSQ0ACwsgAAsLwQIBAEGwwAALuAJzcmMvbGliLnJzAAAwIAAACgAAAMMAAAANAAAAMCAAAAoAAAC8AAAADQAAAGluZGV4IG91dCBvZiBib3VuZHM6IHRoZSBsZW4gaXMgIGJ1dCB0aGUgaW5kZXggaXMgAABcIAAAIAAAAHwgAAASAAAAMDAwMTAyMDMwNDA1MDYwNzA4MDkxMDExMTIxMzE0MTUxNjE3MTgxOTIwMjEyMjIzMjQyNTI2MjcyODI5MzAzMTMyMzMzNDM1MzYzNzM4Mzk0MDQxNDI0MzQ0NDU0NjQ3NDg0OTUwNTE1MjUzNTQ1NTU2NTc1ODU5NjA2MTYyNjM2NDY1NjY2NzY4Njk3MDcxNzI3Mzc0NzU3Njc3Nzg3OTgwODE4MjgzODQ4NTg2ODc4ODg5OTA5MTkyOTM5NDk1OTY5Nzk4OTk='), c => c.charCodeAt()), {console})
export const seed = new Int32Array(8)
const mem = new DataView(exports.memory.buffer), surf = new Int16Array(exports.memory.buffer, +exports.surfaces, 1)
const sd = +exports.seed, off = +exports.offsets
const ch = new Uint8Array(exports.memory.buffer, +exports.chunk, 512), ch2 = new Uint8Array(exports.memory.buffer, exports.chunk + 512, 256)
export const chunk = new Int32Array(exports.memory.buffer, +exports.chunk2 + 768, 4096)
const chunk2 = new Int32Array(chunk.buffer, +exports.chunk2, 384)

export function genNoise(cb, x, y, localSeed = 0, p = 6, r = 0.5){
	for(let yi=0,j=off;yi<65;yi+=16) for(let xi=0;xi<65;xi+=16,j+=4) mem.setFloat32(j, cb(x+xi, y+yi), true)
	exports.fillNoise(x, y, localSeed, p, r)
	return ch
}
export function genNoisev(arr, x, y, localSeed = 0, p = 6, r = 0.5){
	for(let j=0;j<25;j++) mem.setFloat32(off+(j<<2), arr[j], true)
	exports.fillNoise(x, y, localSeed, p, r)
	return ch
}

export function expand(x, y, localSeed = 0, layers0, layers1, noise, noiseUp, noiseDown){
	ch.set(noise)
	ch2.set(noiseUp)
	ch2.set(noiseDown, 128)
	chunk2.set(layers0)
	chunk2.set(layers1, 192)
	surf[0] = 1
	const c = exports.expand(x, y, localSeed)
	return new Int16Array(surf.buffer, surf.byteOffset, c)
}

const enc = new TextEncoder(), {imul} = Math
export function setSeed(str){
	if(typeof str == 'object'){
		for(let i=0,j=sd;i<8;i++,j+=4) mem.setInt32(j, str[i], true)
		return
	}
	const arr = enc.encode(str+'\0')
	seed.fill(0)
	let x = 0xe336beb9|0, i = 0
	let coeff = 1597334673
	// Quick bijective hash
	for(; i < arr.length; i += 4){
		const y = arr[i]<<24|arr[i+1]<<16|arr[i+2]<<8|arr[i+3]
		x = imul(x ^ imul(y, coeff), 0x7feb352d)
		x ^= x >> 15
		coeff += 0x4319fa62
		seed[(i>>2)&7] ^= x
	}
	let j = i >>= 2; coeff = 1
	do{
		x = imul(x, coeff += 0x6eeb828a)
		x ^= x >> 15
		seed[j = j+1&7] ^= x
	}while(j != i)
	for(let i=0,j=sd;i<8;i++,j+=4) mem.setInt32(j, seed[i], true)
}

export function getSeedHash(){
	let x = ''
	for(const i of seed) x += (i>>>0).toString(16).padStart(8, '0')
	return x
}

const biomeBase = +exports.__heap_base
let biomeTip = biomeBase, j = 0
export const addBiome = (t=0,h=0,p=0,b=0,c=0,n=0) => {
	const i = biomeTip
	biomeTip += 24
	if(biomeTip > mem.byteLength) exports.memory.grow(1)
	mem.setFloat32(i, t, true)
	mem.setFloat32(i+4, h, true)
	mem.setFloat32(i+8, 1/(p*p), true)
	mem.setInt32(i+12, b, true)
	mem.setUint32(i+16, c, true)
	mem.setUint32(i+20, n, true)
	return j++
}

export const findBiome = (i=0, t=0, h=0, b=0) => exports.findBiome(biomeBase, i, t, h, b)