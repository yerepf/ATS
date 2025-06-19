#ifndef _FPENGINE_H_
#define _FPENGINE_H_


///////////////////////////////////////////////////////////////////////////////////////////////////
//Windows Custom Message 
#define WM_NCLMESSAGE	WM_USER+120
#define FPM_DEVICE		0x01	//设备
#define FPM_PLACE		0x02	//请按手指
#define FPM_LIFT		0x03	//请抬起手指
#define FPM_CAPTURE		0x04	//采集图像完成
#define FPM_GENCHAR		0x05	//采集特征点
#define FPM_ENRFPT		0x06	//登记指纹
#define FPM_NEWIMAGE	0x07	//新的指纹图像
#define FPM_TIMEOUT		0x08	//超时
#define FPM_IMGVAL		0x09	//图像质量

#define	FPM_ENROLID		0x10
#define FPM_VERIFY		0x11
#define FPM_IDENTIFY	0x12

#define RET_OK			1
#define RET_FAIL		0

//Output Image Type
#define	IMG_ORIGINAL	0x00
#define	IMG_GENERAL		0x01

//Sensor Type
#define SENSOR_OPTYB	0x01  //一标光学头 
#define SENSOR_CLI511	0x02  //凯拓光学头 CLI511 
#define SENSOR_FPC1011	0x11  //FPC1011
#define SENSOR_TCS002	0x12  //TCS2
#define SENSOR_TCS001	0x13  //TCS1
#define SENSOR_IMD200	0x14  //FPM200A
#define SENSOR_IMD301	0x15  //FPM301
#define SENSOR_IMD302	0x16  //FPM302 
#define SENSOR_BFM5352	0x17  //BF5352

//Sound
#define SOUND_BEEP  0
#define SOUND_OK    1
#define SOUND_FAIL  2

///////////////////////////////////////////////////////////////////////////////////////////////////
//Function 

//Open Reader
//style=1 RS232 Reader ,	OpenDevice(1,57600,1)
//style=0 USB Reader,	OpenDevice(0,0,0)
int WINAPI OpenDevice(int comnum = 0, int nbaud = 0, int style = 0);
//Link Reader
int WINAPI LinkDevice(UINT32 password = 0);
//Close Reader
int WINAPI CloseDevice();
//Get Device Model
UINT32 WINAPI GetDeviceModel();
//Get Device Version
BYTE WINAPI GetDeviceVersion();
//Is Support Smart Card
int WINAPI IsSupportCard();
//Is Support Flash Memory
int WINAPI IsSupportFlash();
//Is Support Bluetooth
int WINAPI IsSupportBluetooth();

int WINAPI GetBluetoothInfo(BYTE* macdat,int* macsize,BYTE* namedat,int* namesize);

//Is Support Wifi
int WINAPI IsSupportWifi();
//Is Support Lcd
int WINAPI IsSupportLcd();

//Beep In Device
BOOL WINAPI DeviceSoundBeep(int beep);
//
BOOL WINAPI CMosConfig(BYTE * cfgdat, int size);

//线程函数,实际应用中,主要采用如下函数
//设置消息窗口句柄
void WINAPI SetMsgMainHandle(HWND hWnd);
//设置超时
VOID WINAPI SetTimeOut(double itime);
//采集指纹图像
void WINAPI CaptureImage();
//采集指纹特征点
void WINAPI CaptureTemplate();
//登记指纹模版
void WINAPI EnrollTemplate();
//登记指纹模版
void WINAPI EnrollTemplateCount(int count);

//获取指纹消息
int WINAPI GetWorkMsg();
//获取返回消息
int WINAPI GetRetMsg();
//释放消息
int WINAPI ReleaseMsg();

//获取指纹特征点
BOOL WINAPI GetTemplateByCap(BYTE * tpbuf, int * tpsize);
//获取指纹模版
BOOL WINAPI GetTemplateByEnl(BYTE * fpbuf, int * fpsize);


//获取指纹特征点(字符串)
BOOL WINAPI GetBase64StrByCap(BOOL unicode,BYTE * tpstr);
//获取指纹模版(字符串)
BOOL WINAPI GetBase64StrByEnl(BOOL unicode, BYTE * tpstr);

//获取指纹图像
BOOL WINAPI GetRawImage(BYTE * imagedata, int * size);
BOOL WINAPI GetBmpImage(BYTE * imagedata, int * size);
BOOL WINAPI GetImageSize(int * width, int * height);
//在窗口上画指纹图像,图像使用SDK刚采集的.
int WINAPI DrawImage(HDC hdc, int left, int top);


//Others
HANDLE WINAPI GetHandle();
//设置是否上传图像
VOID WINAPI SetUpImage(BOOL bUpImage);
VOID WINAPI SetImageType(BOOL bRes);
//设置状态灯状态
VOID WINAPI SetStatusLed(int type, int status);
//设置判断图像质量参数
BOOL WINAPI SetImageVal(BOOL bSet, int min, int max);
BOOL WINAPI SetUpConfig(int imagefmt, int isofmt);
BOOL WINAPI GetUpConfig(int *imagefmt, int *isofmt);
BOOL WINAPI SetUartDelay(int uartdelay);

//从指纹图像里提取特征，建立模板,
//返回0表示成功
int WINAPI CreateTemplate(BYTE* pFingerData,BYTE *pTemplate);	

//比对指纹
//返回分数，一般大于80分表示成功。也可以设置其它分数,分数越高,安全等级越高
//pSrcData，pDstData是要匹配的指纹特征，pSrcData，pDstData大小为256BYTE
int WINAPI MatchTemplate(BYTE *pSrcData,BYTE *pDstData);

//比对指纹
//返回分数，一般大于50分表示成功。也可以设置其它分数,分数越高,安全等级越高
//pSrcData,指纹特征点,大小为256BYTE
//pDstData,指纹模版,由nDstSize指定，一般为512BYTE
int WINAPI MatchTemplateOne(BYTE *pSrcData,BYTE *pDstData,int nDstSize);
int WINAPI MatchTemplateFull(BYTE *pSrcData,int nSrcSize,BYTE *pDstData,int nDstSize);

//比对指纹
//pSrcData，指纹特征点,pSrcData大小为256BYTE
//pDstFullData,多个指纹模版
//nDstCount,模版数
//nDstSize,模版的大小
//nThreshold,比对成功分数
//返回-1表示失败,返回>=0,表示多个指纹模版中位于该位置的模版比对成功
int WINAPI MatchTemplateaArray(BYTE *pSrcData,BYTE *pDstFullData,int nDstCount,int nDstSize,int nThreshold);

//检查模板
BOOL WINAPI CheckTemplate(unsigned char *pFeature, int size);
//字符串模板比对
int WINAPI MatchBase64Str(BYTE* pSrcData, BYTE* pDstData, BOOL bunicode);
//BYTE类型模板转字符串模板
VOID WINAPI BytesToBase64(BOOL unicode,BYTE * buf,int size,BYTE * base64str);
//字符串模板转BYTE类型模板
VOID WINAPI Base64ToBytes(BYTE * base64str,BOOL bunicode,BYTE * buf,int * size);



//写入用户自定义信息
BOOL WINAPI WriteUserInfo(BYTE * databuf, int datasize);
//读取用户自定义信息
BOOL WINAPI ReadUserInfo(BYTE * databuf, int datasize);

//获取设备序列号,32位整数值
UINT WINAPI GetDeviceSnNum();
//获取设备序列号,字符串
BOOL WINAPI GetDeviceSnStr(BOOL unicode,BYTE* hexstr);
//获取硬件设备名
BOOL WINAPI GetDeviceName(BOOL unicode, BYTE* devname);
//获取设备日期
BOOL WINAPI GetDeviceDate(BOOL unicode, BYTE* devdate);

//获取硬件随机数,32位整数值
UINT WINAPI GetRandomNum();


//字符转换
DWORD WINAPI TextToDWORD(LPSTR txt);
LPSTR WINAPI DWORDToText(LPSTR txt,DWORD nval);
BOOL WCharToMByte(LPCWSTR lpcwszStr, LPSTR lpszStr, DWORD dwSize);
BOOL MByteToWChar(LPCSTR lpcszStr, LPWSTR lpwszStr, DWORD dwSize);


//
int WINAPI GetDataType(BYTE* input);
int WINAPI StdChangeCoord(BYTE* input,int size,BYTE* output,int dk);
int WINAPI StdToIso(int itype,BYTE* input,BYTE* output);
int WINAPI IsoToStd(int itype,BYTE* input,BYTE* output);

//WSQ Image
int WINAPI RawToWsq(BYTE* imagedata,int width,int height,int depth,int dpi,float bitrate,BYTE* wsqdata,int* wsqsize);
int WINAPI WsqToRaw(BYTE* wsqdata,int wsqsize,BYTE* imagedata,int* width,int* height,int* depth,int* dpi);
int WINAPI BmpToWsq(BYTE* imagedata,int width,int height,int depth,int dpi,float bitrate,BYTE* wsqdata,int* wsqsize);
int WINAPI WsqToBmp(BYTE* wsqdata,int wsqsize,BYTE* imagedata,int* width,int* height,int* depth,int* dpi);


///////////////////////////////////////////////////////////////////////////////////////////////////
//Bluetooth
BOOL WINAPI GetBtComName(LPSTR comname);



///////////////////////////////////////////////////////////////////////////////////////////////////
//Flash Memory
//Get Flash IC ID
BOOL WINAPI FlashGetID(BYTE* idbuf);
//Read Flash Data (Max 32KByte)
BOOL WINAPI FlashReadData(int readaddr, int readsize, BYTE * buffer);
//Write Flash Data (Max 32KByte)
BOOL WINAPI FlashWriteData(int writeaddr, int writesize, BYTE * buffer);

//SPI
BOOL WINAPI SpiReadData(int readsize, BYTE * buffer);
BOOL WINAPI SpiWriteData(int writesize, BYTE * buffer);

///////////////////////////////////////////////////////////////////////////////////////////////////
//Smart Card
BOOL WINAPI GetCardSN(BYTE* cardsn);

BOOL WINAPI	CardReadFull(BYTE* cardsn, int ctype, int sector, BYTE* password, BYTE * buffer, int size);
BOOL WINAPI	CardWriteFull( BYTE* cardsn, int ctype, int sector, BYTE* password, BYTE * buffer, int size);

BOOL WINAPI	CardReadSector(BYTE* cardsn, int sector, BYTE* password, BYTE * buffer);
BOOL WINAPI	CardWriteSector(BYTE* cardsn, int sector, BYTE* password, BYTE * buffer);
BOOL WINAPI CardReadBlock(BYTE* cardsn, int block, BYTE* password, BYTE * buffer);
BOOL WINAPI CardWriteBlock(BYTE* cardsn, int block, BYTE* password, BYTE * buffer);

BOOL WINAPI CardReadValue(BYTE* cardsn, int block, BYTE* password, DWORD * val);
BOOL WINAPI CardWriteValue(BYTE* cardsn, int block, BYTE* password, DWORD  val);
BOOL WINAPI CardIncValue(BYTE* cardsn, int block, BYTE* password, DWORD  val);
BOOL WINAPI CardDecValue(BYTE* cardsn, int block, BYTE* password, DWORD  val);


//Others
BOOL WINAPI SetDeviceDateTime(WORD year, BYTE month, BYTE day, BYTE week, BYTE hour, BYTE minute, BYTE second);
BOOL WINAPI SetDeviceSystemDateTime();

//WIFI

BOOL WINAPI WifiDownloadMode(BYTE bFlash);

#endif