using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ATS_WinForms
{
    public partial class Huella : Form
    {
        public Huella()
        {
            InitializeComponent();
        }

        private string _token;
        private HttpClient client = new HttpClient();

        //Huella
        private const int WM_NCLMESSAGE = 0x400 + 120;
        private const int FPM_CAPTURE = 0x04;


        private void IniciarCapturaHuella()
        {
            int result = FingerPrintSDK.OpenDevice(); 
            if (result != 1)
            {
                MessageBox.Show("Error al abrir el dispositivo.");
                return;
            }

            FingerPrintSDK.LinkDevice();
            FingerPrintSDK.SetTimeOut(10.0);
            FingerPrintSDK.SetMsgMainHandle(this.Handle); 

            FingerPrintSDK.CaptureImage();

            MessageBox.Show("Lector de huellas inicializado.");
        }
        private void btnCapturar_Click(object sender, EventArgs e)
        {
            IniciarCapturaHuella();
        }

        private byte[] ApplySharpenFilter(byte[] buffer, int width, int height)
        {
            int[] kernel = {
                0, -1,  0,
               -1,  5, -1,
                0, -1,  0
            };

            byte[] result = new byte[buffer.Length];

            for (int y = 1; y < height - 1; y++)
            {
                for (int x = 1; x < width - 1; x++)
                {
                    int sum = 0;
                    for (int ky = -1; ky <= 1; ky++)
                    {
                        for (int kx = -1; kx <= 1; kx++)
                        {
                            int px = x + kx;
                            int py = y + ky;
                            int pixel = buffer[py * width + px];
                            int weight = kernel[(ky + 1) * 3 + (kx + 1)];
                            sum += pixel * weight;
                        }
                    }

                    // Clamping
                    sum = Math.Min(255, Math.Max(0, sum));
                    result[y * width + x] = (byte)sum;
                }
            }

            return result;
        }

        protected override void WndProc(ref Message m)
        {

            if (m.Msg == WM_NCLMESSAGE && m.WParam.ToInt32() == FPM_CAPTURE)
            {
                int width = 0, height = 0;
                FingerPrintSDK.GetImageSize(ref width, ref height);
                int size = width * height;
                byte[] buffer = new byte[size];

                if (FingerPrintSDK.GetRawImage(buffer, ref size))
                {
                    // Aplicar filtro de nitidez
                    buffer = ApplySharpenFilter(buffer, width, height);

                    // Crear Bitmap en escala de grises (8 bits)
                    Bitmap bmp = new Bitmap(width, height, System.Drawing.Imaging.PixelFormat.Format8bppIndexed);

                    // Establecer paleta de grises
                    var pal = bmp.Palette;
                    for (int i = 0; i < 256; i++) pal.Entries[i] = Color.FromArgb(i, i, i);
                    bmp.Palette = pal;

                    // Copiar el búfer mejorado al Bitmap
                    var data = bmp.LockBits(new Rectangle(0, 0, width, height),
                        System.Drawing.Imaging.ImageLockMode.WriteOnly, bmp.PixelFormat);
                    Marshal.Copy(buffer, 0, data.Scan0, buffer.Length);
                    bmp.UnlockBits(data);

                    // Mostrar en pictureBox2
                    pictureBox2.Image = bmp;

                    // Guardar imagen como archivo PNG (ruta puede cambiarse)
                    string path = Path.Combine(Application.StartupPath, "huella_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".png");
                    bmp.Save(path, System.Drawing.Imaging.ImageFormat.Png);

                    // Capturar siguiente huella automáticamente (si se desea)
                    FingerPrintSDK.CaptureImage();
                }
            }

            base.WndProc(ref m);
        }



        private void label3_Click(object sender, EventArgs e)
        {

        }

        private void panel1_Paint(object sender, PaintEventArgs e)
        {


        }


        private async void TxtBusqueda_TextChanged(object sender, EventArgs e)
        {
            
        }

        private async void button1_Click(object sender, EventArgs e)
        {
           
        }

        private async void Huella_Load(object sender, EventArgs e)
        {
            await CargarUsuariosAsync();

            dtvFiltro.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.EnableResizing;
            dtvFiltro.ColumnHeadersHeight = 40;


        }

        private async Task CargarUsuariosAsync()
        {
            string loginUrl = "https://backendsas.onrender.com/api/auth/login";
            string usuariosUrl = "https://backendsas.onrender.com/api/students";



            using (HttpClient client = new HttpClient())
            {
                var credenciales = new
                {
                    username = "INPHAAdmin",
                    password = "123456"
                };

                var contenido = new StringContent(JsonConvert.SerializeObject(credenciales), Encoding.UTF8, "application/json");

                var respuestaLogin = await client.PostAsync(loginUrl, contenido);

                if (respuestaLogin.IsSuccessStatusCode)
                {
                    var jsonLogin = await respuestaLogin.Content.ReadAsStringAsync();
                    dynamic resultado = JsonConvert.DeserializeObject(jsonLogin);
                    string token = resultado.token;

                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                    var respuestaUsuarios = await client.GetAsync(usuariosUrl);

                    if (respuestaUsuarios.IsSuccessStatusCode)
                    {
                        var jsonUsuarios = await respuestaUsuarios.Content.ReadAsStringAsync();

                        var jObject = JObject.Parse(jsonUsuarios);

                        if (jObject["students"] != null)
                        {
                            var lista = jObject["students"]?.ToObject<List<JObject>>();

                            var listaFinal = new List<object>();

                            if (lista != null)
                            {
                                foreach (var u in lista)
                                {

                                    listaFinal.Add(new
                                    {
                                        Id_Usuarios = (string)(u["StudentID"] ?? "N/A"),
                                        Nombre = (string)(u["FirstName"] ?? "N/A"),
                                        Apellido = (string)(u["LastName"] ?? "N/A"),
                                    });
                                }
                            }

                            dtvFiltro.AutoGenerateColumns = true;
                            dtvFiltro.DataSource = listaFinal;
                        }
                        else
                        {
                            MessageBox.Show("La respuesta JSON no contiene la propiedad 'usuarios'.");
                        }
                    }
                    else
                    {
                        var error = await respuestaUsuarios.Content.ReadAsStringAsync();
                        MessageBox.Show("Error al obtener usuarios: " + respuestaUsuarios.StatusCode + "\n" + error);
                    }
                    token = resultado.token;
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                }
                else
                {
                    var error = await respuestaLogin.Content.ReadAsStringAsync();
                    MessageBox.Show("Login fallido: " + respuestaLogin.StatusCode + "\n" + error);

                }

                
            }
        }

        int id;



        //Guardar
        private async void guna2Button1_Click(object sender, EventArgs e)
        {
            int studentID1 = id;
            Bitmap bmp = new Bitmap(pictureBox2.Width, pictureBox2.Height);
            pictureBox2.DrawToBitmap(bmp, new Rectangle(0, 0, pictureBox2.Width, pictureBox2.Height));
            await EnviarHuellaAsync(studentID1, bmp);
        }

        private async Task EnviarHuellaAsync(int studentID2, Bitmap bmp)
        {
            var url = "https://backendsas.onrender.com/api/biometrics";

            try
            {
                // Validar que tenemos un token válido
                if (string.IsNullOrEmpty(SesionActual.Token))
                {
                    MessageBox.Show("❌ Error: No hay token de autenticación disponible.");
                    return;
                }

                // Validar que la imagen no sea nula
                if (bmp == null)
                {
                    MessageBox.Show("❌ Error: No hay imagen de huella para enviar.");
                    return;
                }

                // Convertir imagen a byte[] en formato PNG (mejor que BMP para huellas)
                byte[] imagenBytes;
                using (MemoryStream ms = new MemoryStream())
                {
                    bmp.Save(ms, ImageFormat.Png); 
                    imagenBytes = ms.ToArray();
                }

                // Crear el objeto de datos
                var datos = new
                {
                    studentId = studentID2.ToString(),
                    templateData = Convert.ToBase64String(imagenBytes)
                };

                // Serializar con configuración adecuada
                var settings = new JsonSerializerSettings
                {
                    ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver(),
                    Formatting = Formatting.None
                };

                string json = JsonConvert.SerializeObject(datos, settings);

                // Verificar el JSON generado
                Console.WriteLine("JSON a enviar: " + json);
                MessageBox.Show("JSON a enviar:\n" + json);

                // Configurar el contenido y headers
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", SesionActual.Token);

                // Enviar la solicitud
                HttpResponseMessage response = await client.PostAsync(url, content);
                string responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    MessageBox.Show("✅ Huella guardada correctamente.\nRespuesta: " + responseBody);
                }
                else
                {
                    MessageBox.Show($"❌ Error al guardar la huella. Código: {(int)response.StatusCode}\nRespuesta: {responseBody}");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("❌ Error inesperado: " + ex.Message);
            }
        }

        private void dtvFiltro_CellClick_1(object sender, DataGridViewCellEventArgs e)
        {
            guna2TextBox2.Text = dtvFiltro.CurrentRow.Cells[1].Value.ToString();
            id = Convert.ToInt32(dtvFiltro.CurrentRow.Cells[0].Value.ToString());
        }
    }
}
