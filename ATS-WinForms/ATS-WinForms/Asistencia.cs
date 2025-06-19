using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Drawing.Imaging;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Net.Http;
using System.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.IO;
using Newtonsoft.Json.Serialization;

namespace ATS_WinForms
{
    public partial class Asistencia : Form
    {
        public string FirstName { get; set; }

        public Asistencia()
        {
            InitializeComponent();
        }

        private const int WM_NCLMESSAGE = 0x400 + 120;
        private const int FPM_CAPTURE = 0x04;


        private void Tiempo_Tick(object sender, EventArgs e)
        {
            textBox1.Text = DateTime.Now.ToString("hh:mm:ss");
            textBox2.Text = DateTime.Now.ToLongDateString();

        }

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
                    Bitmap bmp = new Bitmap(width, height, System.Drawing.Imaging.PixelFormat.Format8bppIndexed);

                    // Escala de grises
                    var pal = bmp.Palette;
                    for (int i = 0; i < 256; i++) pal.Entries[i] = Color.FromArgb(i, i, i);
                    bmp.Palette = pal;

                    var data = bmp.LockBits(new Rectangle(0, 0, width, height),
                        System.Drawing.Imaging.ImageLockMode.WriteOnly, bmp.PixelFormat);
                    Marshal.Copy(buffer, 0, data.Scan0, buffer.Length);
                    bmp.UnlockBits(data);

                    pictureBox2.Image = bmp;

                    // Si quieres volver a capturar otra huella automáticamente:
                    FingerPrintSDK.CaptureImage();
                }
            }

            base.WndProc(ref m);
        }
        private void btnCapturar_Click(object sender, EventArgs e)
        {
            IniciarCapturaHuella();
        }









        private static readonly HttpClient client = new HttpClient();

        private async void BuscarPorHuella(Bitmap bmp)
        {
            // Validar que tenemos una imagen
            if (bmp == null)
            {
                MessageBox.Show("No hay imagen de huella para enviar", "Error",
                              MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            try
            {
                // Mostrar indicador de progreso
                Cursor.Current = Cursors.WaitCursor;
                textBox3.Text = "Procesando...";

                // Convertir imagen a Base64
                string base64String;
                using (var ms = new MemoryStream())
                {
                    bmp.Save(ms, ImageFormat.Png);
                    base64String = Convert.ToBase64String(ms.ToArray());
                }

                // Validar token
                if (string.IsNullOrEmpty(SesionActual.Token))
                {
                    textBox3.Text = "Error: Sin token";
                    MessageBox.Show("Token de autenticación no disponible", "Error",
                                  MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // Configurar la solicitud
                var requestData = new { templateData = base64String };
                var json = JsonConvert.SerializeObject(requestData, new JsonSerializerSettings
                {
                    ContractResolver = new CamelCasePropertyNamesContractResolver()
                });

                using (var content = new StringContent(json, Encoding.UTF8, "application/json"))
                {
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", SesionActual.Token);

                    // Enviar la solicitud
                    var response = await client.PostAsync("https://backendsas.onrender.com/api/biometrics/template", content);
                    var responseContent = await response.Content.ReadAsStringAsync();

                    // Procesar la respuesta
                    if (response.IsSuccessStatusCode)
                    {
                        ProcessSuccessfulResponse(responseContent);
                    }
                    else
                    {
                        ProcessErrorResponse(response, responseContent);
                    }
                }
            }
            catch (TaskCanceledException)
            {
                textBox3.Text = "Tiempo agotado";
                MessageBox.Show("La operación tardó demasiado", "Error",
                              MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch (Exception ex)
            {
                textBox3.Text = "Error";
                MessageBox.Show($"Error inesperado: {ex.Message}", "Error",
                              MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                Cursor.Current = Cursors.Default;
            }
        }

        private void ProcessSuccessfulResponse(string responseContent)
        {
            try
            {
                var jsonResponse = JObject.Parse(responseContent);
                var firstName = jsonResponse["firstName"]?.ToString();

                if (!string.IsNullOrEmpty(firstName))
                {
                    textBox3.Text = firstName;
                }
                else
                {
                    textBox3.Text = "No reconocido";
                    MessageBox.Show("La huella no fue reconocida", "Resultado",
                                  MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch
            {
                textBox3.Text = "Error en datos";
                MessageBox.Show("La respuesta del servidor no es válida", "Error",
                              MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ProcessErrorResponse(HttpResponseMessage response, string responseContent)
        {
            textBox3.Text = "Error del servidor";

            try
            {
                var errorObj = JObject.Parse(responseContent);
                var errorMessage = errorObj["message"]?.ToString() ?? "Error desconocido";
                MessageBox.Show($"Error del servidor: {errorMessage}", "Error",
                              MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            catch
            {
                MessageBox.Show($"Error del servidor: {(int)response.StatusCode}", "Error",
                              MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async Task HandleServerError(HttpResponseMessage response)
        {
            string errorResponse = await response.Content.ReadAsStringAsync();
            StringBuilder errorDetails = new StringBuilder();
            errorDetails.AppendLine($"Estado HTTP: {(int)response.StatusCode} ({response.StatusCode})");

            try
            {
                var errorObj = JObject.Parse(errorResponse);
                errorDetails.AppendLine($"Código: {errorObj["code"]?.ToString() ?? "No disponible"}");
                errorDetails.AppendLine($"Mensaje: {errorObj["message"]?.ToString() ?? "Error no especificado"}");

                if (errorObj["errors"] != null)
                {
                    errorDetails.AppendLine("\nErrores detallados:");
                    foreach (var error in errorObj["errors"])
                    {
                        errorDetails.AppendLine($"- {error["detail"] ?? error.ToString()}");
                    }
                }
            }
            catch
            {
                errorDetails.AppendLine($"Respuesta cruda: {errorResponse}");
            }

            MessageBox.Show(errorDetails.ToString(),
                          "Error en el servidor",
                          MessageBoxButtons.OK,
                          MessageBoxIcon.Error);
        }


        private async void Buscar_Click(object sender, EventArgs e)
        {
            // 1. Validar que hay una imagen en el PictureBox
            if (pictureBox2.Image == null)
            {
                MessageBox.Show("❌ Primero capture una huella digital", "Advertencia",
                               MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // 2. Convertir la imagen a Bitmap con manejo de recursos
            Bitmap bmp = null;
            try
            {
                bmp = new Bitmap(pictureBox2.Image);

                // 3. Mostrar feedback visual (opcional)
                Cursor = Cursors.WaitCursor; // Cambiar cursor a "esperando"
                Buscar.Enabled = false; // Deshabilitar botón temporalmente

                // 4. Llamar al método de búsqueda
                 BuscarPorHuella(bmp);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"❌ Error al procesar la huella: {ex.Message}",
                              "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                // 5. Restaurar estado inicial
                if (bmp != null) bmp.Dispose();
                Cursor = Cursors.Default;
                Buscar.Enabled = true;
            }
        }





























        private void textBox1_TextChanged(object sender, EventArgs e)
        {

        }

        private void Asistencia_Load(object sender, EventArgs e)
        {

        }

       
    }
}
