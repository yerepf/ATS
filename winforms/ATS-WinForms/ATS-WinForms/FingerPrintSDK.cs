using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace ATS_WinForms
{
    internal class FingerPrintSDK
    {
        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int OpenDevice(int comnum = 0, int nbaud = 0, int style = 0);

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int LinkDevice(uint password = 0);

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int CloseDevice();

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern void SetTimeOut(double itime);

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern void SetMsgMainHandle(IntPtr hWnd);

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern void CaptureImage();

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern bool GetRawImage(byte[] imageData, ref int size);

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern bool GetTemplateByCap(byte[] tpbuf, ref int tpsize);

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern bool GetImageSize(ref int width, ref int height);

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int GetWorkMsg();

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int GetRetMsg();

        [DllImport("fpengine.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int ReleaseMsg();



        [DllImport("FingerPrintSDK.dll", CallingConvention = CallingConvention.StdCall)]
        public static extern int DrawImage(IntPtr hdc, int left, int top);
    }
}
