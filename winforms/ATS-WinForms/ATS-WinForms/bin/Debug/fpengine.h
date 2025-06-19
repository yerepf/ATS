#ifndef _FPENGINE_H_
#define _FPENGINE_H_


///////////////////////////////////////////////////////////////////////////////////////////////////
//Windows Custom Message 
#define WM_NCLMESSAGE	WM_USER+120
#define FPM_DEVICE		0x01	//�豸
#define FPM_PLACE		0x02	//�밴��ָ
#define FPM_LIFT		0x03	//��̧����ָ
#define FPM_CAPTURE		0x04	//�ɼ�ͼ�����
#define FPM_GENCHAR		0x05	//�ɼ�������
#define FPM_ENRFPT		0x06	//�Ǽ�ָ��
#define FPM_NEWIMAGE	0x07	//�µ�ָ��ͼ��
#define FPM_TIMEOUT		0x08	//��ʱ
#define FPM_IMGVAL		0x09	//ͼ������

#define	FPM_ENROLID		0x10
#define FPM_VERIFY		0x11
#define FPM_IDENTIFY	0x12

#define RET_OK			1
#define RET_FAIL		0

//Output Image Type
#define	IMG_ORIGINAL	0x00
#define	IMG_GENERAL		0x01

//Sensor Type
#define SENSOR_OPTYB	0x01  //һ���ѧͷ 
#define SENSOR_CLI511	0x02  //���ع�ѧͷ CLI511 
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

//�̺߳���,ʵ��Ӧ����,��Ҫ�������º���
//������Ϣ���ھ��
void WINAPI SetMsgMainHandle(HWND hWnd);
//���ó�ʱ
VOID WINAPI SetTimeOut(double itime);
//�ɼ�ָ��ͼ��
void WINAPI CaptureImage();
//�ɼ�ָ��������
void WINAPI CaptureTemplate();
//�Ǽ�ָ��ģ��
void WINAPI EnrollTemplate();
//�Ǽ�ָ��ģ��
void WINAPI EnrollTemplateCount(int count);

//��ȡָ����Ϣ
int WINAPI GetWorkMsg();
//��ȡ������Ϣ
int WINAPI GetRetMsg();
//�ͷ���Ϣ
int WINAPI ReleaseMsg();

//��ȡָ��������
BOOL WINAPI GetTemplateByCap(BYTE * tpbuf, int * tpsize);
//��ȡָ��ģ��
BOOL WINAPI GetTemplateByEnl(BYTE * fpbuf, int * fpsize);


//��ȡָ��������(�ַ���)
BOOL WINAPI GetBase64StrByCap(BOOL unicode,BYTE * tpstr);
//��ȡָ��ģ��(�ַ���)
BOOL WINAPI GetBase64StrByEnl(BOOL unicode, BYTE * tpstr);

//��ȡָ��ͼ��
BOOL WINAPI GetRawImage(BYTE * imagedata, int * size);
BOOL WINAPI GetBmpImage(BYTE * imagedata, int * size);
BOOL WINAPI GetImageSize(int * width, int * height);
//�ڴ����ϻ�ָ��ͼ��,ͼ��ʹ��SDK�ղɼ���.
int WINAPI DrawImage(HDC hdc, int left, int top);


//Others
HANDLE WINAPI GetHandle();
//�����Ƿ��ϴ�ͼ��
VOID WINAPI SetUpImage(BOOL bUpImage);
VOID WINAPI SetImageType(BOOL bRes);
//����״̬��״̬
VOID WINAPI SetStatusLed(int type, int status);
//�����ж�ͼ����������
BOOL WINAPI SetImageVal(BOOL bSet, int min, int max);
BOOL WINAPI SetUpConfig(int imagefmt, int isofmt);
BOOL WINAPI GetUpConfig(int *imagefmt, int *isofmt);
BOOL WINAPI SetUartDelay(int uartdelay);

//��ָ��ͼ������ȡ����������ģ��,
//����0��ʾ�ɹ�
int WINAPI CreateTemplate(BYTE* pFingerData,BYTE *pTemplate);	

//�ȶ�ָ��
//���ط�����һ�����80�ֱ�ʾ�ɹ���Ҳ����������������,����Խ��,��ȫ�ȼ�Խ��
//pSrcData��pDstData��Ҫƥ���ָ��������pSrcData��pDstData��СΪ256BYTE
int WINAPI MatchTemplate(BYTE *pSrcData,BYTE *pDstData);

//�ȶ�ָ��
//���ط�����һ�����50�ֱ�ʾ�ɹ���Ҳ����������������,����Խ��,��ȫ�ȼ�Խ��
//pSrcData,ָ��������,��СΪ256BYTE
//pDstData,ָ��ģ��,��nDstSizeָ����һ��Ϊ512BYTE
int WINAPI MatchTemplateOne(BYTE *pSrcData,BYTE *pDstData,int nDstSize);
int WINAPI MatchTemplateFull(BYTE *pSrcData,int nSrcSize,BYTE *pDstData,int nDstSize);

//�ȶ�ָ��
//pSrcData��ָ��������,pSrcData��СΪ256BYTE
//pDstFullData,���ָ��ģ��
//nDstCount,ģ����
//nDstSize,ģ��Ĵ�С
//nThreshold,�ȶԳɹ�����
//����-1��ʾʧ��,����>=0,��ʾ���ָ��ģ����λ�ڸ�λ�õ�ģ��ȶԳɹ�
int WINAPI MatchTemplateaArray(BYTE *pSrcData,BYTE *pDstFullData,int nDstCount,int nDstSize,int nThreshold);

//���ģ��
BOOL WINAPI CheckTemplate(unsigned char *pFeature, int size);
//�ַ���ģ��ȶ�
int WINAPI MatchBase64Str(BYTE* pSrcData, BYTE* pDstData, BOOL bunicode);
//BYTE����ģ��ת�ַ���ģ��
VOID WINAPI BytesToBase64(BOOL unicode,BYTE * buf,int size,BYTE * base64str);
//�ַ���ģ��תBYTE����ģ��
VOID WINAPI Base64ToBytes(BYTE * base64str,BOOL bunicode,BYTE * buf,int * size);



//д���û��Զ�����Ϣ
BOOL WINAPI WriteUserInfo(BYTE * databuf, int datasize);
//��ȡ�û��Զ�����Ϣ
BOOL WINAPI ReadUserInfo(BYTE * databuf, int datasize);

//��ȡ�豸���к�,32λ����ֵ
UINT WINAPI GetDeviceSnNum();
//��ȡ�豸���к�,�ַ���
BOOL WINAPI GetDeviceSnStr(BOOL unicode,BYTE* hexstr);
//��ȡӲ���豸��
BOOL WINAPI GetDeviceName(BOOL unicode, BYTE* devname);
//��ȡ�豸����
BOOL WINAPI GetDeviceDate(BOOL unicode, BYTE* devdate);

//��ȡӲ�������,32λ����ֵ
UINT WINAPI GetRandomNum();


//�ַ�ת��
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